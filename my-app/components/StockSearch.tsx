"use client";
import React, { useEffect, useMemo, useState } from "react";
import StockChart, { Candle } from "./StockChart";

export default function StockSearch() {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ symbol: string; shortname: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [error, setError] = useState<string | null>(null);

  // simple debounce
  const debouncedQ = useMemo(() => q, [q]);

  useEffect(() => {
    if (!debouncedQ || debouncedQ.length < 1) {
      setSuggestions([]);
      return;
    }
    let aborted = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(debouncedQ)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Search failed");
        const j = await res.json();
        if (!aborted) setSuggestions(j.items?.slice(0, 6) || []);
      } catch (e: any) {
        if (!aborted) setSuggestions([]);
      }
    };
    const id = setTimeout(load, 200);
    return () => {
      aborted = true;
      clearTimeout(id);
    };
  }, [debouncedQ]);

  const pick = async (sym: string) => {
    setSymbol(sym);
    setSuggestions([]);
    setQ(sym);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market/history?symbol=${encodeURIComponent(sym)}&range=6mo&interval=1d`, { cache: "no-store" });
      if (!res.ok) throw new Error("History failed");
      const j = await res.json();
      setCandles(j.candles || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load history");
      setCandles([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-center">
      <div className="relative">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ticker (e.g., AAPL)"
          className="input"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-none shadow-card text-center">
            {suggestions.map((s) => (
              <button
                key={s.symbol}
                onClick={() => pick(s.symbol)}
                className="w-full px-3 py-2 hover:bg-gray-100"
              >
                <span className="font-semibold text-gray-900">{s.symbol}</span>
                <span className="ml-2 text-xs text-gray-500">{s.shortname}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      {symbol && (
        <div className="mt-4">
          <div className="mb-2 font-semibold text-gray-900">{symbol}</div>
          {loading && <div className="text-xs text-gray-500">Loading chart…</div>}
          {candles.length > 0 ? (
            <StockChart data={candles} />)
            : (!loading && <div className="text-sm text-gray-500">No data</div>)}
        </div>
      )}
    </div>
  );
}
