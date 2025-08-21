import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const YAHOO_QUOTE = "https://query1.finance.yahoo.com/v7/finance/quote";
const STOOQ_JSON = (s: string) => `https://stooq.com/q/l/?s=${encodeURIComponent(s)}&f=sd2t2ohlcv&h&e=json`;
const COINGECKO_SIMPLE = (ids: string[]) => `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=usd`;

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsStr = searchParams.get("symbols");
    if (!symbolsStr) return NextResponse.json({ items: [] });

    const symbols = symbolsStr.split(",").map((s) => s.trim()).filter(Boolean);
    const chunks: string[][] = [];
    const size = 5; // smaller batches to reduce throttling
    for (let i = 0; i < symbols.length; i += size) chunks.push(symbols.slice(i, i + size));

    const allItems: any[] = [];
    const errors: string[] = [];
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
            beta: typeof q.beta === 'number' ? q.beta : undefined,
            fiftyTwoWeekHigh: typeof q.fiftyTwoWeekHigh === 'number' ? q.fiftyTwoWeekHigh : undefined,
            fiftyTwoWeekLow: typeof q.fiftyTwoWeekLow === 'number' ? q.fiftyTwoWeekLow : undefined,
          };
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
            const candles = Array.isArray(hjson?.candles) ? hjson.candles : [];
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
      if (out.length) return NextResponse.json({ items: out });
      // Soft-fail: return 200 with empty items and an error message for clients to handle gracefully
      return NextResponse.json({ items: [], error: errors.join("; ") || "failed" });
    }
    return NextResponse.json({ items: allItems });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
