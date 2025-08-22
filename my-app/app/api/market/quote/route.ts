import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const YAHOO_QUOTE = "https://query2.finance.yahoo.com/v7/finance/quote";
const YAHOO_QUOTE_SUMMARY = (s: string) => `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(s)}?modules=price,summaryDetail,defaultKeyStatistics,financialData`;
const STOOQ_JSON = (s: string) => `https://stooq.com/q/l/?s=${encodeURIComponent(s)}&f=sd2t2ohlcv&h&e=json`;
const COINGECKO_SIMPLE = (ids: string[]) => `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=usd`;
const FMP_PROFILE = (s: string, k: string) => `https://financialmodelingprep.com/api/v3/profile/${encodeURIComponent(s)}?apikey=${encodeURIComponent(k)}`;
const FMP_QUOTE = (s: string, k: string) => `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(s)}?apikey=${encodeURIComponent(k)}`;
const FMP_RATIOS_TTM = (s: string, k: string) => `https://financialmodelingprep.com/api/v3/ratios-ttm/${encodeURIComponent(s)}?apikey=${encodeURIComponent(k)}`;
const FMP_DIVIDENDS = (s: string, k: string) => `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${encodeURIComponent(s)}?apikey=${encodeURIComponent(k)}&serietype=line`;

// Simple in-memory cache for fundamentals to reduce external calls in serverless
const FUND_CACHE = new Map<string, { data: any; ts: number }>();
const FUND_TTL_MS = 15 * 60 * 1000; // 15 minutes
const now = () => Date.now();
function getFundFromCache(sym: string): any | null {
  const rec = FUND_CACHE.get(sym);
  if (!rec) return null;
  if (now() - rec.ts > FUND_TTL_MS) { FUND_CACHE.delete(sym); return null; }
  return rec.data;
}
function setFundCache(sym: string, data: any) {
  FUND_CACHE.set(sym, { data, ts: now() });
}

const mapCryptoId = (sym: string): string | null => {
  const m: Record<string, string> = {
    "BTC-USD": "bitcoin",
    "ETH-USD": "ethereum",
    "SOL-USD": "solana",
    "DOGE-USD": "dogecoin",
  };
  return m[sym] || null;
};

// Stooq uses different symbols. For most US equities, it's lowercase with .us suffix (e.g., aapl.us)
// Skip non-equity types (crypto, forex, indices) here and return null so other fallbacks can handle them.
const mapStooqSymbol = (sym: string): string | null => {
  const s = String(sym).trim();
  // Skip crypto and forex formats
  if (s.includes("-") || s.includes("=")) return null;
  // Skip common index caret symbols
  if (s.startsWith("^")) return null;
  // Heuristic: treat remaining as US equity
  return `${s.toLowerCase()}.us`;
};

// Heuristic to detect equity symbols (non-crypto/forex/indices)
const isEquitySymbol = (sym: string): boolean => {
  const s = String(sym || '').trim();
  if (!s) return false;
  if (s.includes("-") || s.includes("=")) return false; // crypto/forex
  if (s.startsWith("^")) return false; // indices
  return true;
};

async function fetchFromStooq(symbol: string) {
  try {
    const mapped = mapStooqSymbol(symbol);
    if (!mapped) return null;
    const res = await fetch(STOOQ_JSON(mapped), { cache: "no-store" });
    if (!res.ok) return null;
    const j = await res.json();
    const arr = j?.data || j?.symbols || j?.["Stock" ] || j?.["data"] || [];
    const row = Array.isArray(arr) ? arr[0] : null;
    const c = Number(row?.close);
    if (!isFinite(c)) return null;
    // Stooq lightweight JSON often lacks previous close; leave change fields undefined if not available
    const pc = Number(row?.previous_close ?? row?.prv ?? NaN);
    const change = isFinite(pc) ? c - pc : NaN;
    const changePercent = isFinite(pc) && pc !== 0 ? (change / pc) * 100 : NaN;
    return {
      symbol,
      shortName: symbol,
      price: c,
      change: isFinite(change) ? change : undefined,
      changePercent: isFinite(changePercent) ? changePercent : undefined,
      currency: "USD",
    };
  } catch { return null; }
}

// Optional fallback: Financial Modeling Prep profile
async function fetchFmpProfile(symbol: string, debug?: string[]) {
  try {
    const key = process.env.FMP_API_KEY;
    if (!key) { if (debug) debug.push(`fmp ${symbol} skipped: no FMP_API_KEY`); return null; }
    const res = await fetch(FMP_PROFILE(symbol, key), { cache: 'no-store' });
    if (!res.ok) {
      if (debug) debug.push(`fmp ${symbol} profile status ${res.status}`);
      if (res.status === 429) {
        // try quote endpoint as a lighter fallback; may still be rate-limited
        try {
          const r2 = await fetch(FMP_QUOTE(symbol, key), { cache: 'no-store' });
          if (r2.ok) {
            const jq = await r2.json();
            const q = Array.isArray(jq) ? jq[0] : null;
            if (q) {
              const trailingPE = typeof q?.pe === 'number' ? q.pe : undefined;
              const epsTTM = typeof q?.eps === 'number' ? q.eps : undefined;
              const outAny: any = { symbol, trailingPE, epsTTM };
              if (debug) debug.push(`fmp ${symbol} quote-lite ok under 429: pe=${trailingPE}, eps=${epsTTM}`);
              return outAny;
            }
          } else if (debug) debug.push(`fmp ${symbol} quote-lite status ${r2.status}`);
        } catch (e:any) { if (debug) debug.push(`fmp ${symbol} quote-lite failed: ${e?.message || 'error'}`); }
        return null;
      }
      return null;
    }
    const j = await res.json();
    const row = Array.isArray(j) ? j[0] : null;
    if (!row) { if (debug) debug.push(`fmp ${symbol} profile empty`); return null; }
    let trailingPE = typeof row?.pe === 'number' ? row.pe : undefined;
    let epsTTM = typeof row?.eps === 'number' ? row.eps : undefined;
    // Prefer explicit dividendYield if present; otherwise try ratios-ttm later
    let dividendYield = typeof row?.dividendYield === 'number' ? (row.dividendYield * 100) : undefined;
    const beta = typeof row?.beta === 'number' ? row.beta : undefined;

    // If pe/eps missing, try FMP quote endpoint
    if ((typeof trailingPE !== 'number') || (typeof epsTTM !== 'number')) {
      try {
        const r2 = await fetch(FMP_QUOTE(symbol, key), { cache: 'no-store' });
        if (r2.ok) {
          const jq = await r2.json();
          const q = Array.isArray(jq) ? jq[0] : null;
          if (q) {
            if (typeof q?.pe === 'number' && !isFinite(trailingPE as number)) trailingPE = q.pe;
            if (typeof q?.eps === 'number' && !isFinite(epsTTM as number)) epsTTM = q.eps;
          } else if (debug) debug.push(`fmp ${symbol} quote empty`);
        } else if (debug) debug.push(`fmp ${symbol} quote status ${r2.status}`);
      } catch (e:any) { if (debug) debug.push(`fmp ${symbol} quote failed: ${e?.message || 'error'}`); }
    }

    // If dividendYield still missing, try ratios-ttm (dividendYieldTTM as decimal)
    if (typeof dividendYield !== 'number') {
      try {
        const r3 = await fetch(FMP_RATIOS_TTM(symbol, key), { cache: 'no-store' });
        if (r3.ok) {
          const jr = await r3.json();
          const rrow = Array.isArray(jr) ? jr[0] : null;
          const dy = rrow?.dividendYieldTTM;
          if (typeof dy === 'number' && isFinite(dy)) dividendYield = dy * 100;
          else if (debug) debug.push(`fmp ${symbol} ratios missing dividendYieldTTM`);
        } else if (debug) debug.push(`fmp ${symbol} ratios status ${r3.status}`);
      } catch (e:any) { if (debug) debug.push(`fmp ${symbol} ratios failed: ${e?.message || 'error'}`); }
    }

    const out: any = { symbol, trailingPE, epsTTM, dividendYield, beta };
    if (debug) debug.push(`fmp ${symbol} ok: pe=${trailingPE}, eps=${epsTTM}, yld=${dividendYield}, beta=${beta}`);
    return out;
  } catch (e: any) {
    if (debug) debug.push(`fmp ${symbol} failed: ${e?.message || 'error'}`);
    return null;
  }
}

// Compute dividend yield using last 365 days dividends from FMP and current price
async function fetchDividendYieldTTM(symbol: string, price: number, debug?: string[]) {
  try {
    const key = process.env.FMP_API_KEY;
    if (!key) return undefined;
    const res = await fetch(FMP_DIVIDENDS(symbol, key), { cache: 'no-store' });
    if (!res.ok) { if (debug) debug.push(`fmp ${symbol} dividends status ${res.status}`); return undefined; }
    const j = await res.json();
    const arr: any[] = Array.isArray(j?.historical) ? j.historical : [];
    if (!arr.length || !isFinite(price) || price <= 0) return undefined;
    const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
    let sum = 0;
    for (const d of arr) {
      const dt = Date.parse(d?.date);
      const div = Number(d?.dividend ?? d?.adjDividend);
      if (isFinite(dt) && dt >= cutoff && isFinite(div)) sum += div;
    }
    if (sum > 0) return (sum / price) * 100;
    return undefined;
  } catch { return undefined; }
}

// Fallback: scrape Yahoo Finance HTML and parse embedded JSON (root.App.main)
async function fetchYahooFinancePageSummary(symbol: string, debug?: string[]) {
  try {
    const urls = [
      `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}?p=${encodeURIComponent(symbol)}`,
      `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/key-statistics?p=${encodeURIComponent(symbol)}`,
    ];
    const headers = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://finance.yahoo.com/",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    } as any;
    let page: any = null;
    for (let i = 0; i < urls.length; i++) {
      const res = await fetch(urls[i], { headers, cache: 'no-store' });
      if (!res.ok) { if (debug) debug.push(`html ${symbol} status ${res.status} for u${i}`); continue; }
      const html = await res.text();
      const m = html.match(/root\.App\.main\s*=\s*(\{[\s\S]*?\});/);
      if (!m) { if (debug) debug.push(`html ${symbol} no root.App.main for u${i}`); continue; }
      try { page = JSON.parse(m[1]); break; } catch { if (debug) debug.push(`html ${symbol} JSON parse failed u${i}`); }
    }
    if (!page) return null;
    const stores = page?.context?.dispatcher?.stores || {};
    const qss = stores?.QuoteSummaryStore || {};
    const price = qss?.price || {};
    const sd = qss?.summaryDetail || {};
    const ks = qss?.defaultKeyStatistics || {};
    const out: any = {
      symbol,
      shortName: price.shortName,
      longName: price.longName,
      trailingPE: typeof (ks.trailingPE?.raw) === 'number' ? ks.trailingPE.raw : (typeof sd.trailingPE?.raw === 'number' ? sd.trailingPE.raw : undefined),
      epsTTM: typeof (ks.trailingEps?.raw) === 'number' ? ks.trailingEps.raw : (typeof price.epsTrailingTwelveMonths?.raw === 'number' ? price.epsTrailingTwelveMonths.raw : undefined),
      dividendYield: typeof (sd.dividendYield?.raw) === 'number' ? sd.dividendYield.raw * 100 : undefined,
      beta: typeof (ks.beta?.raw) === 'number' ? ks.beta.raw : undefined,
      fiftyTwoWeekHigh: typeof (sd.fiftyTwoWeekHigh?.raw) === 'number' ? sd.fiftyTwoWeekHigh.raw : (typeof price.fiftyTwoWeekHigh?.raw === 'number' ? price.fiftyTwoWeekHigh.raw : undefined),
      fiftyTwoWeekLow: typeof (sd.fiftyTwoWeekLow?.raw) === 'number' ? sd.fiftyTwoWeekLow.raw : (typeof price.fiftyTwoWeekLow?.raw === 'number' ? price.fiftyTwoWeekLow.raw : undefined),
      currency: price.currency,
    };
    return out;
  } catch (e: any) { if (debug) debug.push(`html ${symbol} failed: ${e?.message || 'error'}`); return null; }
}

async function fetchYahooQuoteSummary(symbol: string, debug?: string[]) {
  try {
    const variants = [
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=price,summaryDetail,defaultKeyStatistics,financialData&region=US&corsDomain=finance.yahoo.com`,
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=price,summaryDetail,defaultKeyStatistics,financialData&region=US&corsDomain=finance.yahoo.com`,
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=price,summaryDetail,defaultKeyStatistics,financialData`,
    ];
    let lastErr: any = null;
    for (let i = 0; i < variants.length; i++) {
      try {
        const res = await fetch(variants[i], {
          headers: { "User-Agent": "justbuyyourstockbro", "Accept": "application/json" },
          cache: "no-store",
        });
        if (!res.ok) { lastErr = new Error(`status ${res.status}`); if (debug) debug.push(`quoteSummary ${symbol} variant${i} status ${res.status}`); continue; }
        const j = await res.json();
        const r = j?.quoteSummary?.result?.[0];
        if (!r) { lastErr = new Error('no result'); if (debug) debug.push(`quoteSummary ${symbol} variant${i} no result`); continue; }
        const price = r.price || {};
        const sd = r.summaryDetail || {};
        const ks = r.defaultKeyStatistics || {};
        const fd = r.financialData || {};
        const out: any = {
          symbol,
          shortName: price.shortName,
          longName: price.longName,
          trailingPE: typeof (ks.trailingPE?.raw) === 'number' ? ks.trailingPE.raw : (typeof sd.trailingPE?.raw === 'number' ? sd.trailingPE.raw : undefined),
          epsTTM: typeof (ks.trailingEps?.raw) === 'number' ? ks.trailingEps.raw : (typeof price.epsTrailingTwelveMonths?.raw === 'number' ? price.epsTrailingTwelveMonths.raw : undefined),
          dividendYield: typeof (sd.dividendYield?.raw) === 'number' ? sd.dividendYield.raw * 100 : (typeof fd.dividendYield?.raw === 'number' ? fd.dividendYield.raw * 100 : undefined),
          beta: typeof (ks.beta?.raw) === 'number' ? ks.beta.raw : undefined,
          fiftyTwoWeekHigh: typeof (sd.fiftyTwoWeekHigh?.raw) === 'number' ? sd.fiftyTwoWeekHigh.raw : (typeof price.fiftyTwoWeekHigh?.raw === 'number' ? price.fiftyTwoWeekHigh.raw : undefined),
          fiftyTwoWeekLow: typeof (sd.fiftyTwoWeekLow?.raw) === 'number' ? sd.fiftyTwoWeekLow.raw : (typeof price.fiftyTwoWeekLow?.raw === 'number' ? price.fiftyTwoWeekLow.raw : undefined),
          currency: price.currency,
        };
        return out;
      } catch (e) { lastErr = e; }
      await new Promise((r) => setTimeout(r, 200 * (i + 1)));
    }
    throw lastErr || new Error('quoteSummary failed');
  } catch (e: any) { if (debug) debug.push(`quoteSummary ${symbol} failed: ${e?.message || 'error'}`); return null; }
}

async function enrichWithQuoteSummary(items: any[], debug?: string[]) {
  const out = [...items];
  const missingIdxs: number[] = [];
  const isProd = process.env.NODE_ENV === 'production';
  for (let i = 0; i < out.length; i++) {
    const it = out[i];
    const equ = isEquitySymbol(it?.symbol);
    // Always enrich equities; for others, enrich only if missing
    const lacks = (
      it == null ||
      (typeof it.trailingPE !== 'number') ||
      (typeof it.epsTTM !== 'number') ||
      (typeof it.dividendYield !== 'number') ||
      (typeof it.beta !== 'number') ||
      (typeof it.fiftyTwoWeekHigh !== 'number') ||
      (typeof it.fiftyTwoWeekLow !== 'number') ||
      (!it.longName && !it.shortName)
    );
    if (equ || lacks) missingIdxs.push(i);
  }
  for (const i of missingIdxs) {
    const sym = out[i]?.symbol;
    if (!sym) continue;
    // small pacing
    await new Promise((r) => setTimeout(r, 80));
    // Cache first
    let s = getFundFromCache(sym);
    if (!s) {
      if (isProd) {
        // In production, prefer FMP first; but if that fails (e.g., 429), try Yahoo as last resort
        s = await fetchFmpProfile(sym, debug);
        if (!s) {
          s = await fetchYahooQuoteSummary(sym, debug);
          if (!s) s = await fetchYahooFinancePageSummary(sym, debug);
        }
      } else {
        s = await fetchYahooQuoteSummary(sym, debug);
        if (!s) s = await fetchYahooFinancePageSummary(sym, debug);
        if (!s) s = await fetchFmpProfile(sym, debug);
      }
      if (s) setFundCache(sym, s);
    }
    if (s) {
      out[i] = {
        ...out[i],
        longName: out[i].longName ?? s.longName,
        shortName: out[i].shortName ?? s.shortName,
        trailingPE: typeof out[i].trailingPE === 'number' ? out[i].trailingPE : s.trailingPE,
        epsTTM: typeof out[i].epsTTM === 'number' ? out[i].epsTTM : s.epsTTM,
        dividendYield: typeof out[i].dividendYield === 'number' ? out[i].dividendYield : s.dividendYield,
        beta: typeof out[i].beta === 'number' ? out[i].beta : s.beta,
        fiftyTwoWeekHigh: typeof out[i].fiftyTwoWeekHigh === 'number' ? out[i].fiftyTwoWeekHigh : s.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: typeof out[i].fiftyTwoWeekLow === 'number' ? out[i].fiftyTwoWeekLow : s.fiftyTwoWeekLow,
        currency: out[i].currency ?? s.currency,
      };
      // If dividend still missing and we have price, compute TTM dividend yield via FMP dividend history
      const priceNow = Number(out[i]?.price);
      if (!(typeof out[i].dividendYield === 'number') && isFinite(priceNow)) {
        const dy = await fetchDividendYieldTTM(sym, priceNow, debug);
        if (typeof dy === 'number' && isFinite(dy)) out[i].dividendYield = dy;
      }
    } else if (debug) {
      debug.push(`quoteSummary missing for ${sym}`);
    }
  }
  return out;
}

async function fetchFromCoinGecko(symbols: string[]) {
  const idMap: Record<string, string> = {};
  for (const s of symbols) {
    const id = mapCryptoId(s);
    if (id) idMap[s] = id;
  }
  const ids = Object.values(idMap);
  if (!ids.length) return [] as any[];
  try {
    const res = await fetch(COINGECKO_SIMPLE(ids), { cache: "no-store" });
    if (!res.ok) return [] as any[];
    const j = await res.json();
    const out: any[] = [];
    for (const [sym, id] of Object.entries(idMap)) {
      const price = Number(j?.[id]?.usd);
      if (isFinite(price)) {
        out.push({ symbol: sym, shortName: sym, price, currency: "USD" });
      }
    }
    return out;
  } catch { return [] as any[]; }
}

async function enrichWithHistory(origin: string, items: any[]) {
  const out = [...items];
  for (let i = 0; i < out.length; i++) {
    const it = out[i];
    const sym = it?.symbol;
    if (!sym) continue;
    // Always compute 52W range from 1y history; compute changePercent only if missing
    const needChangePct = !(typeof it.changePercent === 'number' && isFinite(it.changePercent));
    try {
      // slight pacing
      await new Promise((r) => setTimeout(r, 60));
      const hres = await fetch(`${origin}/api/market/history?symbol=${encodeURIComponent(sym)}&range=1y&interval=1d&_=${Date.now()}`, { cache: 'no-store' });
      if (!hres.ok) continue;
      const hj = await hres.json();
      const candles: any[] = Array.isArray(hj?.items) ? hj.items : (Array.isArray(hj?.candles) ? hj.candles : []);
      if (!candles.length) continue;
      // Compute 52W high/low from entire 1y window
      let hi = -Infinity, lo = Infinity;
      for (const c of candles) {
        const v = Number(c?.c);
        if (isFinite(v)) {
          if (v > hi) hi = v;
          if (v < lo) lo = v;
        }
      }
      if (isFinite(hi) && isFinite(lo)) {
        it.fiftyTwoWeekHigh = hi;
        it.fiftyTwoWeekLow = lo;
      }
      if (needChangePct) {
        const last = candles[candles.length - 1];
        const prev = candles.length >= 2 ? candles[candles.length - 2] : null;
        const lastC = Number(last?.c);
        const prevC = Number(prev?.c);
        if (isFinite(lastC) && isFinite(prevC) && prevC !== 0) {
          const change = lastC - prevC;
          it.change = change;
          it.changePercent = (change / prevC) * 100;
        }
      }
      out[i] = it;
    } catch {}
  }
  return out;
}

export async function GET(req: Request) {
  try {
    // Fallback: if env not present, try to load from .env.local manually (dev convenience)
    if (!process.env.FMP_API_KEY || !process.env.MISTRAL_API_KEY) {
      try {
        const cwd = process.cwd();
        const envPath = path.join(cwd, ".env.local");
        if (fs.existsSync(envPath)) {
          const raw = fs.readFileSync(envPath, "utf8");
          for (const line of raw.split(/\n+/)) {
            const l = line.trim();
            if (!l || l.startsWith('#')) continue;
            const eq = l.indexOf('=');
            if (eq <= 0) continue;
            const k = l.slice(0, eq).trim();
            const v = l.slice(eq + 1).trim();
            if (!(k in process.env)) {
              process.env[k] = v;
            }
          }
        }
      } catch {}
    }
    const { searchParams } = new URL(req.url);
    const symbolsStr = searchParams.get("symbols");
    const debugMode = searchParams.get("debug") === '1' || searchParams.get("debug") === 'true';
    if (!symbolsStr) return NextResponse.json({ items: [] });

    const symbols = symbolsStr.split(",").map((s) => s.trim()).filter(Boolean);
    const chunks: string[][] = [];
    const size = 1; // single-symbol batches to avoid throttling and data omissions
    for (let i = 0; i < symbols.length; i += size) chunks.push(symbols.slice(i, i + size));

    const allItems: any[] = [];
    const errors: string[] = [];
    const debugInfo: string[] = [];
    if (debugMode) {
      const cwd = process.cwd();
      const envPath = path.join(cwd, ".env.local");
      const exists = fs.existsSync(envPath);
      debugInfo.push(`env FMP_API_KEY present=${Boolean(process.env.FMP_API_KEY)}`);
      debugInfo.push(`cwd=${cwd}`);
      debugInfo.push(`envFileExists=${exists} at ${envPath}`);
    }
    for (let bi = 0; bi < chunks.length; bi++) {
      const batch = chunks[bi];
      try {
        if (bi > 0) {
          // small delay between batches to reduce throttling
          await new Promise((r) => setTimeout(r, 250));
        }
        const url = `${YAHOO_QUOTE}?symbols=${encodeURIComponent(batch.join(","))}&region=US&lang=en-US`;
        // simple retry loop
        let res: Response | null = null;
        let lastErr: any = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            res = await fetch(url, {
              headers: { "User-Agent": "justbuyyourstockbro", "Accept": "application/json" },
              cache: "no-store",
            });
            if (res.ok) break;
            lastErr = new Error(`Yahoo quote failed: ${res.status}`);
          } catch (e) {
            lastErr = e;
          }
          await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
        }
        if (!res || !res.ok) throw lastErr || new Error("Yahoo quote failed");
        const data = await res.json();
        let items = (data?.quoteResponse?.result || []).map((q: any) => {
          const priceRaw = q.postMarketPrice ?? q.preMarketPrice ?? q.regularMarketPrice;
          const changeRaw = q.postMarketChange ?? q.preMarketChange ?? q.regularMarketChange;
          const changePctRaw = q.postMarketChangePercent ?? q.preMarketChangePercent ?? q.regularMarketChangePercent;
          let price = Number(priceRaw);
          let change = Number(changeRaw);
          let changePercent = Number(changePctRaw);
          const prevClose = Number(q.regularMarketPreviousClose);
          if (!isFinite(price) && isFinite(prevClose)) {
            price = prevClose;
          }
          if (!isFinite(change) && isFinite(price) && isFinite(prevClose) && prevClose !== 0) {
            change = price - prevClose;
          }
          if (!isFinite(changePercent) && isFinite(change) && isFinite(prevClose) && prevClose !== 0) {
            changePercent = (change / prevClose) * 100;
          }
          const item = {
            symbol: q.symbol,
            shortName: q.shortName,
            price,
            change,
            changePercent,
            currency: q.currency,
            trailingPE: typeof q.trailingPE === 'number' ? q.trailingPE : undefined,
            epsTTM: typeof q.epsTrailingTwelveMonths === 'number' ? q.epsTrailingTwelveMonths : undefined,
            dividendYield: typeof q.trailingAnnualDividendYield === 'number' ? q.trailingAnnualDividendYield * 100 : undefined,
            beta: typeof q.beta === 'number' ? q.beta : undefined,
            fiftyTwoWeekHigh: typeof q.fiftyTwoWeekHigh === 'number' ? q.fiftyTwoWeekHigh : undefined,
            fiftyTwoWeekLow: typeof q.fiftyTwoWeekLow === 'number' ? q.fiftyTwoWeekLow : undefined,
          } as any;
          if (debugMode && (
              typeof item.trailingPE !== 'number' ||
              typeof item.epsTTM !== 'number' ||
              typeof item.dividendYield !== 'number' ||
              typeof item.beta !== 'number')) {
            debugInfo.push(`v7 missing fundamentals for ${q.symbol}: trailingPE=${q.trailingPE}, epsTTM=${q.epsTrailingTwelveMonths}, dividendYield=${q.trailingAnnualDividendYield}, beta=${q.beta}`);
          }
          return item;
        });
        // Fallback: if this batch yielded no items, try per-symbol fetches
        if (!items.length) {
          const perItems: any[] = [];
          for (const sym of batch) {
            try {
              await new Promise((r) => setTimeout(r, 200));
              const u = `${YAHOO_QUOTE}?symbols=${encodeURIComponent(sym)}&region=US&lang=en-US`;
              let r1: Response | null = null;
              let last: any = null;
              for (let at = 0; at < 2; at++) {
                try {
                  r1 = await fetch(u, { headers: { "User-Agent": "justbuyyourstockbro", "Accept": "application/json" }, cache: "no-store" });
                  if (r1.ok) break;
                  last = new Error(`Yahoo quote failed: ${r1.status}`);
                } catch (er) {
                  last = er;
                }
                await new Promise((r) => setTimeout(r, 200 * (at + 1)));
              }
              if (!r1 || !r1.ok) continue;
              const d1 = await r1.json();
              const itms = (d1?.quoteResponse?.result || []).map((q: any) => {
                const priceRaw = q.postMarketPrice ?? q.preMarketPrice ?? q.regularMarketPrice;
                const changeRaw = q.postMarketChange ?? q.preMarketChange ?? q.regularMarketChange;
                const changePctRaw = q.postMarketChangePercent ?? q.preMarketChangePercent ?? q.regularMarketChangePercent;
                let price = Number(priceRaw);
                let change = Number(changeRaw);
                let changePercent = Number(changePctRaw);
                const prevClose = Number(q.regularMarketPreviousClose);
                if (!isFinite(price) && isFinite(prevClose)) {
                  price = prevClose;
                }
                if (!isFinite(change) && isFinite(price) && isFinite(prevClose) && prevClose !== 0) {
                  change = price - prevClose;
                }
                if (!isFinite(changePercent) && isFinite(change) && isFinite(prevClose) && prevClose !== 0) {
                  changePercent = (change / prevClose) * 100;
                }
                return {
                  symbol: q.symbol,
                  shortName: q.shortName,
                  price,
                  change,
                  changePercent,
                  currency: q.currency,
                  trailingPE: typeof q.trailingPE === 'number' ? q.trailingPE : undefined,
                  epsTTM: typeof q.epsTrailingTwelveMonths === 'number' ? q.epsTrailingTwelveMonths : undefined,
                  dividendYield: typeof q.trailingAnnualDividendYield === 'number' ? q.trailingAnnualDividendYield * 100 : undefined,
                };
              });
              perItems.push(...itms);
            } catch {}
          }
          items = perItems;
        }
        // Secondary fallback: for any symbols still missing, try Stooq (equities) and CoinGecko (crypto)
        const got = new Set(items.map((x: any) => x.symbol));
        const missing = batch.filter((s) => !got.has(s));
        if (missing.length) {
          const cryptoSyms = missing.filter((s) => mapCryptoId(s));
          const eqSyms = missing.filter((s) => !mapCryptoId(s));
          const extra: any[] = [];
          // CoinGecko in one request
          if (cryptoSyms.length) {
            const cg = await fetchFromCoinGecko(cryptoSyms);
            extra.push(...cg);
          }
          // Stooq per symbol (keep light rate)
          for (const s of eqSyms) {
            await new Promise((r) => setTimeout(r, 120));
            const st = await fetchFromStooq(s);
            if (st) extra.push(st);
          }
          items.push(...extra);
        }
        allItems.push(...items);
      } catch (err: any) {
        errors.push(err?.message || "batch failed");
      }
    }

    if (allItems.length === 0) {
      // Final fallback over all symbols
      const cryptoSyms = symbols.filter((s) => mapCryptoId(s));
      const eqSyms = symbols.filter((s) => !mapCryptoId(s));
      const out: any[] = [];
      if (cryptoSyms.length) out.push(...(await fetchFromCoinGecko(cryptoSyms)));
      for (const s of eqSyms) {
        await new Promise((r) => setTimeout(r, 120));
        const st = await fetchFromStooq(s);
        if (st) out.push(st);
      }
      // If still missing, use our own history endpoint to derive the last close (charts already work)
      try {
        const origin = new URL(req.url).origin;
        const have = new Set(out.map((x: any) => x.symbol));
        const missing = symbols.filter((s) => !have.has(s));
        for (const s of missing) {
          try {
            // slight pacing
            await new Promise((r) => setTimeout(r, 100));
            const hres = await fetch(`${origin}/api/market/history?symbol=${encodeURIComponent(s)}&range=5d&interval=1d&_=${Date.now()}`, { cache: "no-store" });
            if (!hres.ok) continue;
            const hjson = await hres.json();
            const candles = Array.isArray(hjson?.items) ? hjson.items : (Array.isArray(hjson?.candles) ? hjson.candles : []);
            if (candles.length) {
              const last = candles[candles.length - 1];
              const c = Number(last?.c);
              if (isFinite(c)) {
                out.push({ symbol: s, shortName: s, price: c, currency: "USD" });
              }
            }
          } catch {}
        }
      } catch {}
      if (out.length) {
        // Enrich fundamentals where possible
        const origin = new URL(req.url).origin;
        const enrichedOut = await enrichWithQuoteSummary(out, debugMode ? debugInfo : undefined);
        const finalOut = await enrichWithHistory(origin, enrichedOut);
        return NextResponse.json(debugMode ? { items: finalOut, debug: debugInfo } : { items: finalOut });
      }
      // Soft-fail: return 200 with empty items and an error message for clients to handle gracefully
      return NextResponse.json({ items: [], error: errors.join("; ") || "failed" });
    }
    // Enrich fundamentals and compute 52W/changePercent from history if missing
    const origin = new URL(req.url).origin;
    const enriched = await enrichWithQuoteSummary(allItems, debugMode ? debugInfo : undefined);
    const final = await enrichWithHistory(origin, enriched);
    return NextResponse.json(debugMode ? { items: final, debug: debugInfo } : { items: final });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
