"use client";

import React, { useEffect, useState } from "react";
import PriceChart from "@/components/PriceChart";
import InfoTooltip from "@/components/InfoTooltip";

export default function RecommendPage() {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.map((rec:any)=> (
              <div key={rec.symbol} className="card text-center">
                <div className="mb-1 text-charcoal"><span className="font-bold">{rec.symbol}</span> <span className="text-sm font-normal text-black">{rec.name}</span></div>
                <div className="text-sm font-semibold">{rec.price? `$${rec.price.toFixed(2)}`:'—'}</div>
                {rec.reasoning && <div className="mt-1 text-xs text-black">{rec.reasoning}</div>}
              </div>
            ))}
          </div>
        </section>
      ): <p className="text-center text-sm">No saved recommendations. Go back to chat.</p>}

      {other.length>0 && (
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
    </main>
  );
}
