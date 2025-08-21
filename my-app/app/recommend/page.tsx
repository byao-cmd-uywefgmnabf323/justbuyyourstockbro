"use client";

import React, { useEffect, useState } from "react";
import PriceChart from "@/components/PriceChart";
import InlineDef from "@/components/InlineDef";
import ProjectionTool from "@/components/ProjectionTool";

export default function RecommendPage() {
  const [showOther, setShowOther] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [other, setOther] = useState<any[]>([]);
  const [otherLoading, setOtherLoading] = useState(false);
  const [otherLoadedCount, setOtherLoadedCount] = useState(0);
  const [recLoading, setRecLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // baseline universe copied from old page
  const BASE_UNIVERSE: string[] = [
    "AAPL","MSFT","NVDA","TSLA","AMZN","GOOGL","META","AMD","NFLX","JPM",
    "V","MA","BAC","XOM","CVX","JNJ","PEP","KO","DIS","NKE",
    "HD","PG","UNH","LLY","ABBV","AVGO","COST","WMT","ORCL","CRM",
    "INTC","CSCO","ADBE","TXN","QCOM","SHOP","PYPL","SQ","UBER","ABNB",
    "BTC-USD","ETH-USD","SOL-USD","DOGE-USD","ADA-USD","BNB-USD",
    "EURUSD=X","USDJPY=X","GBPUSD=X","USDCHF=X",
  ];

  // simplified baseline loader (price only)
  const loadBaseline = async (excludeSyms: string[]) => {
    try {
      const exclude = new Set(excludeSyms.map((s) => s.toUpperCase()));
      const universe = BASE_UNIVERSE.filter((s) => !exclude.has(s));
      if (!universe.length) { setOther([]); return; }
      const placeholders = universe.map((s) => ({ symbol: s, price: null, change1D: "—" }));
      setOther(placeholders);
      setOtherLoading(true);
      const loaded: any[] = [];
      await Promise.all(universe.map(async (sym) => {
        try {
          const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(sym)}&_=${Date.now()}`);
          const j = await res.json();
          if (Array.isArray(j.items) && j.items[0]) {
            const q = j.items[0];
            loaded.push({ symbol: q.symbol, name: q.longName || q.shortName || q.symbol, price: q.price, change1D: typeof q.changePercent==='number'? `${q.changePercent.toFixed(2)}%`:'—' });
          }
        } catch {}
      }));
      const merged = universe.map((s) => loaded.find(l=>l.symbol===s) || placeholders.find(p=>p.symbol===s));
      setOther(merged as any[]);
    } finally { setOtherLoading(false); }
  };

  // Fetch live quotes for the given symbols and merge into results
  const refreshQuotesForResults = async (baseResults: any[]) => {
    if (!baseResults || baseResults.length === 0) return baseResults;
    const symbols = baseResults.map((r:any)=>r.symbol).filter(Boolean);
    if (!symbols.length) return baseResults;
    try {
      const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(symbols.join(","))}&_=${Date.now()}`, { cache: "no-store" });
      const j = await res.json();
      if (!Array.isArray(j.items)) return baseResults;
      const liveMap = new Map(j.items.map((q:any)=>[q.symbol, q]));
      return baseResults.map((r:any)=>{
        const live = liveMap.get(r.symbol);
        if (!live) return r;
        return {
          ...r,
          price: Number.isFinite(live.price) ? live.price : r.price,
          change1D: typeof live.changePercent==='number'? `${live.changePercent.toFixed(2)}%` : r.change1D,
          pe: typeof live.trailingPE==='number' && isFinite(live.trailingPE) ? live.trailingPE : r.pe,
          eps: typeof live.epsTTM==='number' && isFinite(live.epsTTM) ? live.epsTTM : r.eps,
          dy: typeof live.dividendYield==='number' && isFinite(live.dividendYield) ? live.dividendYield : r.dy,
          high52w: typeof live.fiftyTwoWeekHigh==='number' ? live.fiftyTwoWeekHigh : r.high52w,
          low52w: typeof live.fiftyTwoWeekLow==='number' ? live.fiftyTwoWeekLow : r.low52w,
        };
      });
    } catch { return baseResults; }
  };

  // helper to refetch from session chat on demand
  const refetchFromSession = async () => {
    const chatRaw = window.sessionStorage.getItem("jbysb_last_chat");
    if (!chatRaw) return;
    setRecLoading(true);
    try {
      const chat = JSON.parse(chatRaw);
      const r = await fetch("/api/ai/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat }) });
      const j = await r.json();
      if (Array.isArray(j.suggestions) && j.suggestions.length) {
        const merged = await refreshQuotesForResults(j.suggestions);
        setResults(merged);
        try { window.localStorage.setItem("jbysb_last_recs", JSON.stringify(merged)); } catch {}
        loadBaseline(j.suggestions.map((r:any)=>String(r.symbol)));
      }
    } finally {
      setRecLoading(false);
    }
  };


  useEffect(()=>{
    const init = async () => {
      try {
        let baselineLoaded = false;
        const CLIENT_FALLBACK = [
          { symbol: "AAPL", name: "Apple", price: 185, change1D: "+0.5%", change1W: "+1.3%", change1M: "+4.2%", pe: 29, eps: 6.2, dy: 0.6, marketCap: "$2.9T", sector: "Technology", beta: 1.2, high52w: 199, low52w: 150, reasoning: "Blue-chip tech with resilient cash flows.", fit_reason: "Stability + growth.", signal: "Buy", type: "equity" },
          { symbol: "MSFT", name: "Microsoft", price: 410, change1D: "+0.3%", change1W: "+2.1%", change1M: "+6.0%", pe: 32, eps: 9.8, dy: 0.8, marketCap: "$3.1T", sector: "Technology", beta: 0.9, high52w: 425, low52w: 320, reasoning: "Cloud/enterprise leader with recurring revenue.", fit_reason: "Long-term compounding.", signal: "Buy", type: "equity" },
          { symbol: "NVDA", name: "NVIDIA", price: 900, change1D: "+1.0%", change1W: "+3.5%", change1M: "+12.0%", pe: 40, eps: 8.0, dy: 0.1, marketCap: "$2.2T", sector: "Technology", beta: 1.7, high52w: 950, low52w: 400, reasoning: "AI/data center tailwinds; high volatility.", fit_reason: "Growth exposure.", signal: "Buy", type: "equity" },
          { symbol: "JNJ", name: "Johnson & Johnson", price: 160, change1D: "-0.2%", change1W: "+0.8%", change1M: "+2.0%", pe: 18, eps: 7.2, dy: 2.8, marketCap: "$380B", sector: "Healthcare", beta: 0.6, high52w: 180, low52w: 150, reasoning: "Defensive healthcare with dividend stability.", fit_reason: "Lower volatility core.", signal: "Hold", type: "equity" },
          { symbol: "V", name: "Visa", price: 245, change1D: "+0.4%", change1W: "+1.0%", change1M: "+3.1%", pe: 31, eps: 8.1, dy: 0.7, marketCap: "$570B", sector: "Financials", beta: 0.95, high52w: 260, low52w: 210, reasoning: "Global payments secular growth.", fit_reason: "Quality compounding.", signal: "Buy", type: "equity" },
          { symbol: "BTC-USD", name: "Bitcoin", price: 65000, change1D: "+2.0%", change1W: "+5.0%", change1M: "+18.0%", pe: null, eps: null, dy: null, marketCap: "$1.2T", sector: "Crypto", beta: 2.1, high52w: 73000, low52w: 25000, reasoning: "High-risk diversification; volatile.", fit_reason: "Risk-tolerant slice.", signal: "Hold", type: "crypto" },
          { symbol: "ETH-USD", name: "Ethereum", price: 3400, change1D: "+1.2%", change1W: "+3.8%", change1M: "+12.5%", pe: null, eps: null, dy: null, marketCap: "$400B", sector: "Crypto", beta: 2.0, high52w: 4000, low52w: 1400, reasoning: "Smart contracts/DeFi platform.", fit_reason: "Tech-forward exposure.", signal: "Hold", type: "crypto" },
        ];
        const saved = window.localStorage.getItem("jbysb_last_recs");
        if (saved) {
          const arr = JSON.parse(saved);
          if (Array.isArray(arr) && arr.length > 0) {
            setResults(arr);
            loadBaseline(arr.map((r:any)=>String(r.symbol)));
            baselineLoaded = true;
          }
        }
        if (!baselineLoaded) {
          // Fallback: try to refetch using last chat from sessionStorage
          const chatRaw = window.sessionStorage.getItem("jbysb_last_chat");
          if (chatRaw) {
            setRecLoading(true);
            try {
              const chat = JSON.parse(chatRaw);
              const r = await fetch("/api/ai/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat }) });
              const j = await r.json();
              if (Array.isArray(j.suggestions) && j.suggestions.length) {
                setResults(j.suggestions);
                try { window.localStorage.setItem("jbysb_last_recs", JSON.stringify(j.suggestions)); } catch {}
                loadBaseline(j.suggestions.map((r:any)=>String(r.symbol)));
                baselineLoaded = true;
              }
            } finally {
              setRecLoading(false);
            }
          }
        }
        if (!baselineLoaded) {
          // Load baseline universe so View More is immediately useful
          loadBaseline([]);
          // And populate client fallback recs so the page never looks empty
          setResults(CLIENT_FALLBACK);
          try { window.localStorage.setItem("jbysb_last_recs", JSON.stringify(CLIENT_FALLBACK)); } catch {}
        }
      } catch {
        // As a last resort, load baseline
        loadBaseline([]);
        // Also set client fallback recs
        const CLIENT_FALLBACK = [
          { symbol: "AAPL", name: "Apple", price: 185, change1D: "+0.5%", change1W: "+1.3%", change1M: "+4.2%", pe: 29, eps: 6.2, dy: 0.6, signal: "Buy", type: "equity" },
          { symbol: "MSFT", name: "Microsoft", price: 410, change1D: "+0.3%", change1W: "+2.1%", change1M: "+6.0%", pe: 32, eps: 9.8, dy: 0.8, signal: "Buy", type: "equity" },
          { symbol: "NVDA", name: "NVIDIA", price: 900, change1D: "+1.0%", change1W: "+3.5%", change1M: "+12.0%", pe: 40, eps: 8.0, dy: 0.1, signal: "Buy", type: "equity" },
          { symbol: "JNJ", name: "Johnson & Johnson", price: 160, change1D: "-0.2%", change1W: "+0.8%", change1M: "+2.0%", pe: 18, eps: 7.2, dy: 2.8, signal: "Hold", type: "equity" },
          { symbol: "V", name: "Visa", price: 245, change1D: "+0.4%", change1W: "+1.0%", change1M: "+3.1%", pe: 31, eps: 8.1, dy: 0.7, signal: "Buy", type: "equity" },
          { symbol: "BTC-USD", name: "Bitcoin", price: 65000, change1D: "+2.0%", change1W: "+5.0%", change1M: "+18.0%", signal: "Hold", type: "crypto" },
          { symbol: "ETH-USD", name: "Ethereum", price: 3400, change1D: "+1.2%", change1W: "+3.8%", change1M: "+12.5%", signal: "Hold", type: "crypto" },
        ];
        setResults(CLIENT_FALLBACK);
        try { window.localStorage.setItem("jbysb_last_recs", JSON.stringify(CLIENT_FALLBACK)); } catch {}
      }
    };
    init();
  },[]);

  // Always update results with live quote data for accurate price/quantitative info
  useEffect(() => {
    if (!results || results.length === 0) return;
    let cancelled = false;
    (async () => {
      const merged = await refreshQuotesForResults(results);
      if (!cancelled) setResults(merged);
    })();
    return () => { cancelled = true; };
  }, [results && results.map(r=>r.symbol).join(",")]);

  return (
    <main className="min-h-screen py-10 px-4 bg-background">
      <h1 className="text-2xl font-bold text-center mb-6 text-charcoal">Your AI-Tailored Stock Ideas</h1>

      {results.length>0 ? (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3 text-charcoal text-center">Recommendations</h2>
          <div className="max-w-2xl mx-auto mb-4">
            <form
              onSubmit={(e)=>{e.preventDefault(); (async()=>{
                const raw = searchQuery.trim();
                if (!raw) return;
                const tokens = raw.split(/[ ,\n\t]+/).filter(Boolean).slice(0,10);
                const looksLikeTicker = (s: string) => /^[A-Z0-9=.-]+$/.test(s) && s.toUpperCase() === s;
                let symbols = tokens.filter(t => looksLikeTicker(t)).map(t=>t.toUpperCase());
                setSearchLoading(true); setSearchResults([]);
                try {
                  if (symbols.length === 0) {
                    // Fallback to name search
                    const sres = await fetch(`/api/market/search?q=${encodeURIComponent(raw)}&_=${Date.now()}`, { cache: 'no-store' });
                    const sj = await sres.json();
                    const syms = Array.isArray(sj.items) ? sj.items.map((i:any)=>i.symbol) : [];
                    symbols = syms.slice(0, 5);
                  }
                  if (symbols.length === 0) { setSearchResults([]); return; }
                  const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(symbols.join(","))}&_=${Date.now()}`, { cache: "no-store" });
                  const j = await res.json();
                  const items = Array.isArray(j.items) ? j.items : [];
                  const mapped = items.map((q: any) => ({
                    type: String(q.symbol).endsWith("-USD") ? "crypto" : String(q.symbol).endsWith("=X") ? "forex" : "equity",
                    symbol: q.symbol,
                    name: q.longName || q.shortName || q.symbol,
                    price: Number.isFinite(q.price) ? q.price : null,
                    change1D: typeof q.changePercent === 'number' ? `${q.changePercent.toFixed(2)}%` : '—',
                    change1W: '—',
                    change1M: '—',
                    rating: undefined,
                    pe: typeof (q as any).trailingPE === 'number' && isFinite((q as any).trailingPE) ? (q as any).trailingPE : null,
                    eps: typeof (q as any).epsTTM === 'number' && isFinite((q as any).epsTTM) ? (q as any).epsTTM : null,
                    dy: typeof (q as any).dividendYield === 'number' && isFinite((q as any).dividendYield) ? (q as any).dividendYield : null,
                    reasoning: '',
                    signal: 'Hold',
                  }));
                  setSearchResults(mapped);
                } catch { setSearchResults([]); }
                finally { setSearchLoading(false); }
              })(); }}
              className="flex gap-2"
            >
              <input
                value={searchQuery}
                onChange={(e)=>setSearchQuery(e.target.value)}
                placeholder="Search symbols, e.g., AAPL, MSFT"
                className="flex-1 border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal"
              />
              <button type="submit" className="px-4 py-2 bg-black text-white text-sm">Search</button>
            </form>
            {searchLoading && <div className="mt-2 text-center text-xs text-black">Searching…</div>}
            {!searchLoading && searchResults.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-3">
                {searchResults.map((sr:any) => (
                  <div key={`sr-${sr.symbol}`} className="flex flex-col md:flex-row items-stretch bg-white border border-gray-200 rounded p-3 gap-3">
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-black">
                        {sr.symbol} <span className="text-sm font-normal text-gray-800">{sr.name}</span>
                      </div>
                      <div className="mt-1 text-sm">
                        <span className="font-semibold">{Number.isFinite(sr.price)? `$${sr.price.toFixed(2)}` : '—'}</span>
                        <span className={`ml-2 ${String(sr.change1D || '').startsWith('-')? 'text-red-600':'text-green-600'}`}>{sr.change1D || '—'}</span>
                      </div>
                      <div className="mt-2">
                        <a className="text-sm underline" href={`/symbol/${encodeURIComponent(sr.symbol)}`}>Open</a>
                      </div>
                    </div>
                    <div className="min-w-[220px] flex items-center justify-center">
                      <PriceChart symbol={sr.symbol} range="6mo" interval="1d" height={100} showMA={false} showEMA={false} showMACD={false} showRSI={false} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            {results.map((rec:any)=> (
              <div key={rec.symbol} className="flex flex-col md:flex-row items-stretch bg-white border border-gray-200 rounded-lg shadow p-4 gap-4">
                <div className="flex-[2] flex flex-col justify-between min-w-[160px]">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="text-2xl font-bold text-black">{rec.name}</div>
                  </div>
                  <div className="flex flex-wrap gap-4 mb-2 text-xs">
                    <span>
                      Price: <b>{rec.price ? `$${rec.price.toFixed(2)}` : '—'}</b>
                    </span>
                    <span className={typeof rec.change1D === 'string' && rec.change1D.startsWith('-') ? 'text-red-600' : 'text-green-600'}>
                      1D: {rec.change1D || '—'}
                    </span>
                    <span>
                      1W: {rec.change1W || '—'}
                    </span>
                    <span>
                      1M: {rec.change1M || '—'}
                    </span>
                    <span>
                      <InlineDef label="P/E" term="P/E Ratio" definition="P/E compares a company’s price to its earnings; lower can imply cheaper valuation." href="/academy/pe-ratio" />
                      {' '}
                      <b>{rec.pe ?? '—'}</b>
                    </span>
                    <span>
                      <InlineDef label="EPS" term="EPS" definition="Earnings Per Share: a company’s profit divided by the number of shares." href="/academy/eps" />
                      {' '}
                      <b>{rec.eps ?? '—'}</b>
                    </span>
                    <span>
                      <InlineDef label="Div Yield" term="Dividend Yield" definition="Annual dividends as a percentage of the share price." href="/academy/dividend-yield" />{' '}
                      <b>{rec.dividendYield ?? rec.dy ?? '—'}</b>
                    </span>
                    <span>
                      <InlineDef label="Beta" term="Beta" definition="Beta measures a stock’s volatility vs. the market; 0.8 ≈ 20% less volatile than average." href="/academy/beta" />{' '}
                      <b>{rec.beta ?? '—'}</b>
                    </span>
                    <span>
                      <InlineDef label="52W High" term="52-Week High" definition="The highest trading price over the last 52 weeks." href="/academy/52-week-range" />{' '}
                      <b>{rec.high52w ?? '—'}</b>
                    </span>
                    <span>
                      <InlineDef label="52W Low" term="52-Week Low" definition="The lowest trading price over the last 52 weeks." href="/academy/52-week-range" />{' '}
                      <b>{rec.low52w ?? '—'}</b>
                    </span>
                  </div>
                  {rec.fit_reason && <div className="mb-1 text-xs text-blue-800">{rec.fit_reason}</div>}
                  {rec.reasoning && <div className="text-xs text-black max-w-2xl mt-1">{rec.reasoning}</div>}
                </div>
                <div className="flex-1 flex items-center justify-center min-w-[220px]">
                  <PriceChart symbol={rec.symbol} range="6mo" interval="1d" height={120} showMA={false} showEMA={false} showMACD={false} showRSI={false} />
                </div>
                <div className="md:col-span-2">
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-900">Investment Projection</summary>
                    <ProjectionTool symbol={rec.symbol} currentPrice={rec.price} />
                  </details>
                </div>
                <div className="md:col-span-2 mt-1">
                  <a className="text-sm underline" href={`/symbol/${encodeURIComponent(rec.symbol)}`}>Open</a>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center text-sm">
          {recLoading ? (
            <p>Getting your picks…</p>
          ) : (
            <div className="space-y-3">
              <p>No saved recommendations.</p>
              <div className="flex justify-center gap-3">
                <button className="px-4 py-2 bg-black text-white rounded" onClick={refetchFromSession}>Try again</button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
