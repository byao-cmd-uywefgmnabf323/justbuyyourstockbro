"use client";
import React, { Suspense, useEffect, useState } from "react";
import PriceChart from "@/components/PriceChart";

const BASE_UNIVERSE = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "META", name: "Meta Platforms" },
  { symbol: "JPM", name: "JPMorgan Chase" },
  { symbol: "V", name: "Visa" },
  { symbol: "JNJ", name: "Johnson & Johnson" },
];

export default function MarketHome() {
  const [results, setResults] = useState<any[]>([]);
  const [other, setOther] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherLoading, setOtherLoading] = useState(false);
  const [otherLoadedCount, setOtherLoadedCount] = useState(0);
  const [showOther, setShowOther] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | "equity" | "crypto" | "forex">("all");

  const filtered = results.filter((r) => filter === "all" || r.type === filter);

  const toggleExpand = (symbol: string) => {
    setExpanded((prev) => ({ ...prev, [symbol]: !prev[symbol] }));
  };

  const fetchOtherStocks = async () => {
    setOtherLoading(true);
    setOtherLoadedCount(0);
    const fetched: any[] = [];
    for (const stock of BASE_UNIVERSE) {
      try {
        const res = await fetch(`/api/market/quote?symbol=${stock.symbol}`);
        const data = await res.json();
        if (data) fetched.push(data);
      } catch (error) {
        console.error(`Failed to fetch other stock ${stock.symbol}:`, error);
      }
      setOtherLoadedCount(prev => prev + 1);
    }
    setOther(fetched);
    setOtherLoading(false);
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="min-h-screen bg-background py-8">
        <div className="w-full max-w-laptop mx-auto px-4">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold text-charcoal">Find Your Next Investment</h1>
            <p className="text-sm text-black mt-1">Enter your preferences to get personalized stock recommendations.</p>
          </header>

          {/* Other Stocks Toggle */}
          <div className="text-center mb-2">
            <button
              className="px-4 py-2 border border-gray-300 text-sm text-black hover:bg-gray-100"
              onClick={() => setShowOther(!showOther)}
            >
              {showOther ? "Hide" : "Show"} Other Stocks
            </button>
            <button
              className="ml-2 px-4 py-2 border border-gray-300 text-sm text-black hover:bg-gray-100"
              onClick={fetchOtherStocks}
              disabled={otherLoading}
            >
              Reload Other Stocks
            </button>
          </div>
          {/* Subtle progress indicator under toggle */}
          {otherLoading && (
            <div className="mt-1 text-center text-xs text-black">
              {`Loading Other Stocks… (${Math.round((otherLoadedCount / BASE_UNIVERSE.length) * 100)}%)`}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold mb-3 text-charcoal text-center">Recommendations</h2>
              {/* Filter buttons */}
              <div className="mb-4 flex items-center justify-center gap-2">
                {([
                  { label: "All", val: "all" },
                  { label: "Stocks", val: "equity" },
                  { label: "Crypto", val: "crypto" },
                  { label: "Forex", val: "forex" },
                ] as const).map((b) => (
                  <button
                    key={b.val}
                    type="button"
                    onClick={() => setFilter(b.val)}
                    className={`px-3 py-2 border rounded-none text-sm ${
                      filter === b.val
                        ? "bg-foreground text-white border-gray-900"
                        : "bg-white text-charcoal border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {filtered.map((rec) => (
                  <div key={`${rec.type}-${rec.symbol}`} className="card text-center">
                    <div className="mb-1 text-charcoal">
                      <span className="font-bold">{rec.symbol}</span>{' '}<span className="text-sm font-normal text-black">{rec.name}</span>
                    </div>
                    {/* type badge */}
                    <div className="mb-2 text-xs">
                      <span className="inline-block px-2 py-0.5 border border-gray-400 rounded-none text-gray-700 bg-gray-100">
                        {rec.type === "equity" ? "Stock" : rec.type === "crypto" ? "Crypto" : "Forex"}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold">{(() => { const pv = Number((rec as any).price); return isFinite(pv) ? `$${pv.toFixed(2)}` : '—'; })()}</span>
                      <span className={`ml-2 ${String(rec.change1D).startsWith("-") ? "text-red-600" : "text-green-600"}`}>{rec.change1D}</span>
                    </div>
                    {/* Rating */}
                    {typeof rec.rating === "number" && (
                      <div className="mt-1 text-xs text-charcoal">
                        <span className="font-semibold">Rating:</span>{" "}
                        <span aria-label={`Rating ${rec.rating} out of 5`}>
                          {"★".repeat(Math.max(0, Math.min(5, Math.round(rec.rating))))}
                          {"☆".repeat(Math.max(0, 5 - Math.round(rec.rating)))}
                        </span>
                        <span className="ml-1">({rec.rating}/5)</span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-black">
                      <span>24h {rec.change1D}</span>
                      <span>· 1W {rec.change1W}</span>
                      <span>· 1M {rec.change1M}</span>
                    </div>
                    {expanded[rec.symbol] && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-gray-100 border border-gray-300">
                          <div className="text-xs text-black">P/E Ratio</div>
                          <div className="font-semibold">{rec.pe ?? "—"}</div>
                        </div>
                        <div className="p-3 bg-gray-100 border border-gray-300">
                          <div className="text-xs text-black">EPS</div>
                          <div className="font-semibold">{rec.eps ?? "—"}</div>
                        </div>
                        <div className="p-3 bg-gray-100 border border-gray-300">
                          <div className="text-xs text-black">Dividend Yield</div>
                          <div className="font-semibold">{rec.dy ?? "—"}%</div>
                        </div>
                        <div className="sm:col-span-3 text-sm text-black text-center">
                          <span className="font-semibold">Strategy Alignment:</span> {rec.reasoning}
                        </div>
                        <div className="sm:col-span-3 text-center">
                          <span className="text-xs text-black">Signal:</span>{" "}
                          <span className={`ml-1 text-sm font-semibold ${rec.signal === "Buy" ? "text-green-600" : rec.signal === "Sell" ? "text-red-600" : "text-yellow-600"}`}>{rec.signal || "Hold"}</span>
                        </div>
                        {/* Chart */}
                        <div className="sm:col-span-3">
                          <PriceChart symbol={rec.type === "forex" ? `${rec.symbol}=X` : rec.symbol} range="6mo" interval="1d" height={220} />
                        </div>
                      </div>
                    )}
                    <div className="mt-3 flex justify-center items-center">
                      <button
                        className="text-sm text-gray-900 hover:opacity-80"
                        onClick={() => toggleExpand(rec.symbol)}
                      >
                        {expanded[rec.symbol] ? "Hide details" : "Show details"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Other Stocks */}
          {showOther && other.length > 0 && (
            <section id="other-stocks" className="mt-10">
              <h2 className="text-lg font-semibold mb-3 text-charcoal text-center">Other Stocks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {other.map((rec) => (
                  <div key={`other-${rec.symbol}`} className="card text-center">
                    <div className="mb-1 font-bold text-charcoal">
                      {rec.symbol} <span className="text-sm font-normal text-black">{rec.name}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold">{(() => { const pv = Number((rec as any).price); return Number.isFinite(pv) ? `$${pv.toFixed(2)}` : '—'; })()}</span>
                      <span className={`ml-2 ${String(rec.change1D).startsWith("-") ? "text-red-600" : "text-green-600"}`}>{rec.change1D}</span>
                    </div>
                    {/* Indicators */}
                    {(typeof rec.pe === 'number' || typeof rec.eps === 'number' || typeof rec.dy === 'number') && (
                      <div className="mt-1 text-xs text-black">
                        {typeof rec.pe === 'number' && isFinite(rec.pe) && <span>P/E {rec.pe.toFixed(1)}</span>}
                        {typeof rec.eps === 'number' && isFinite(rec.eps) && <span className="ml-2">EPS {rec.eps.toFixed(2)}</span>}
                        {typeof rec.dy === 'number' && isFinite(rec.dy) && <span className="ml-2">DY {rec.dy.toFixed(2)}%</span>}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-black">
                      <span>24h {rec.change1D}</span>
                      <span>· 1W {rec.change1W}</span>
                      <span>· 1M {rec.change1M}</span>
                    </div>
                    <div className="mt-3">
                      <a className="text-sm underline" href={`/symbol/${encodeURIComponent(rec.symbol)}`}>Open</a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </Suspense>
  );
}
