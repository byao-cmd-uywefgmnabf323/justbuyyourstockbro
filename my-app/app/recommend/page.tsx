"use client";

import React, { useEffect, useState } from "react";
import PriceChart from "@/components/PriceChart";
import InfoTooltip from "@/components/InfoTooltip";

export default function RecommendPage() {
  const [showOther, setShowOther] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [other, setOther] = useState<any[]>([]);
  const [otherLoading, setOtherLoading] = useState(false);
  const [otherLoadedCount, setOtherLoadedCount] = useState(0);

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

  useEffect(()=>{
    try {
      const saved = window.localStorage.getItem("jbysb_last_recs");
      if (saved) {
        const arr = JSON.parse(saved);
        setResults(arr);
        loadBaseline(arr.map((r:any)=>String(r.symbol)));
      }
    } catch {}
  },[]);

  return (
    <main className="min-h-screen py-10 px-4 bg-background">
      <h1 className="text-2xl font-bold text-center mb-6 text-charcoal">Your AI-Tailored Stock Ideas</h1>

      {results.length>0 ? (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3 text-charcoal text-center">Recommendations</h2>
          <div className="flex flex-col gap-4">
            {results.map((rec:any)=> (
              <div key={rec.symbol} className="flex flex-col md:flex-row items-stretch bg-white border border-gray-200 rounded-lg shadow p-4 gap-4">
                <div className="flex-[2] flex flex-col justify-between min-w-[160px]">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="text-2xl font-bold text-black">{rec.symbol}</div>
                    <div className="text-sm text-gray-600">{rec.name}</div>
                  </div>
                  <div className="flex flex-wrap gap-4 mb-2 text-xs">
                    <span>Price: <b>{rec.price ? `$${rec.price.toFixed(2)}` : '—'}</b></span>
                    <span className={typeof rec.change1D === 'string' && rec.change1D.startsWith('-') ? 'text-red-600' : 'text-green-600'}>1D: {rec.change1D || '—'}</span>
                    <span>1W: {rec.change1W || '—'}</span>
                    <span>1M: {rec.change1M || '—'}</span>
                    <span>P/E: <b>{rec.pe ?? '—'}</b></span>
                    <span>EPS: <b>{rec.eps ?? '—'}</b></span>
                    <span>Div Yield: <b>{rec.dividendYield ?? rec.dy ?? '—'}</b></span>
                    <span>Market Cap: <b>{rec.marketCap ?? '—'}</b></span>
                    <span>Sector: <b>{rec.sector ?? '—'}</b></span>
                    <span>Beta: <b>{rec.beta ?? '—'}</b></span>
                    <span>52W High: <b>{rec.high52w ?? '—'}</b></span>
                    <span>52W Low: <b>{rec.low52w ?? '—'}</b></span>
                  </div>
                  {rec.fit_reason && <div className="mb-1 text-xs text-blue-800">{rec.fit_reason}</div>}
                  {rec.reasoning && <div className="text-xs text-black max-w-2xl mt-1">{rec.reasoning}</div>}
                </div>
                <div className="flex-1 flex items-center justify-center min-w-[180px]">
                  <PriceChart symbol={rec.symbol} range="1M" interval="1d" height={80} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ): <p className="text-center text-sm">No saved recommendations. Go back to chat.</p>}

      {other.length>0 && (
        <>
          <div className="flex justify-center my-6">
            <button
              className="px-5 py-2 bg-gray-800 text-white rounded shadow hover:bg-gray-700"
              onClick={() => setShowOther(true)}
            >
              View More
            </button>
          </div>
          {showOther && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-charcoal text-center">Other Stocks</h2>
              {otherLoading && <p className="text-center text-xs text-gray-500 mb-2">Loading {otherLoadedCount}/{BASE_UNIVERSE.length}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {other.map(o=> (
                  <div key={o.symbol} className="card text-center">
                    <div className="font-bold text-charcoal mb-1">{o.symbol}</div>
                    <div className="text-sm font-semibold">{o.price? `$${o.price.toFixed(2)}`:'—'} <span className={String(o.change1D).startsWith('-')? 'text-red-600':'text-green-600'}>{o.change1D}</span></div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
