"use client";
import React, { useState } from "react";

export default function BacktestPage() {
  const [symbol, setSymbol] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [strategy, setStrategy] = useState("Buy when price crosses above 50DMA; sell when below. 1% per-trade fee, no leverage.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ summary: string; metrics: any; bullets: string[] } | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, start, end, strategy }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Backtest failed");
      setResult(j);
    } catch (e: any) {
      setError(e?.message || "Failed to backtest");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-10 bg-background">
      <div className="w-full max-w-laptop mx-auto px-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-black">AI Backtesting</h1>
          <p className="text-sm text-black mt-1">Describe a strategy and timeframe. We'll generate a high-level, AI-driven backtest summary.</p>
        </header>

        <section className="border border-gray-300 bg-white p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-sm font-semibold text-black mb-1">Symbol</div>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL"
                className="w-full border border-gray-300 bg-white text-charcoal px-3 py-2 rounded-none"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-black mb-1">Start (YYYY-MM-DD)</div>
              <input
                value={start}
                onChange={(e) => setStart(e.target.value)}
                placeholder="e.g., 2022-01-01"
                className="w-full border border-gray-300 bg-white text-charcoal px-3 py-2 rounded-none"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-black mb-1">End (YYYY-MM-DD)</div>
              <input
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                placeholder="e.g., 2024-08-01"
                className="w-full border border-gray-300 bg-white text-charcoal px-3 py-2 rounded-none"
              />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-semibold text-black mb-1">Strategy</div>
            <textarea
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full border border-gray-300 bg-white text-charcoal p-3 min-h-[120px] rounded-none"
            />
          </div>
          <div className="mt-4">
            <button
              onClick={run}
              disabled={loading || !symbol}
              className="inline-flex items-center border border-gray-900 bg-black text-white px-4 py-2 rounded-none disabled:opacity-60"
            >
              {loading ? "Running…" : "Run Backtest"}
            </button>
          </div>
          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </section>

        {result && (
          <section className="border border-gray-300 bg-white p-4">
            <h2 className="font-semibold text-black mb-2">Summary</h2>
            <p className="text-sm text-black">{result.summary}</p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-black">
              <div className="border border-gray-300 p-2"><div className="text-xs">CAGR</div><div className="font-semibold">{result.metrics?.cagr ?? "—"}</div></div>
              <div className="border border-gray-300 p-2"><div className="text-xs">Volatility</div><div className="font-semibold">{result.metrics?.volatility ?? "—"}</div></div>
              <div className="border border-gray-300 p-2"><div className="text-xs">Sharpe</div><div className="font-semibold">{result.metrics?.sharpe ?? "—"}</div></div>
              <div className="border border-gray-300 p-2"><div className="text-xs">Max Drawdown</div><div className="font-semibold">{result.metrics?.maxDrawdown ?? "—"}</div></div>
            </div>
            {result.bullets?.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-black mb-1">Takeaways</h3>
                <ul className="list-disc pl-5 text-sm text-black space-y-1">
                  {result.bullets.map((b, i) => (<li key={i}>{b}</li>))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
