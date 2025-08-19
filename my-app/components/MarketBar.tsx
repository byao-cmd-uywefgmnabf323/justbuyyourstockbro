"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

type QuoteItem = {
  symbol: string;
  shortName?: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
};

// Curated list of popular tickers (equities + crypto). Add more as needed.
const SYMBOLS: string[] = [
  "AAPL","MSFT","NVDA","TSLA","AMZN","GOOGL","META","AMD","NFLX","JPM",
  "V","MA","BAC","XOM","CVX","JNJ","PEP","KO","DIS","NKE",
  // Crypto (Yahoo uses -USD suffix)
  "BTC-USD","ETH-USD","SOL-USD","DOGE-USD",
];

const BATCH_SIZE = 4; // smaller to avoid throttling

export default function MarketBar() {
  const [data, setData] = useState<QuoteItem[]>(
    SYMBOLS.map((s) => ({ symbol: s, shortName: s, price: NaN, change: NaN, changePercent: NaN }))
  );
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);

  const load = async () => {
    try {
      setError(null);
      const symbols = SYMBOLS.slice(cursor, cursor + BATCH_SIZE);
      const qs = encodeURIComponent(symbols.join(","));
      const res = await fetch(`/api/market/quote?symbols=${qs}&_=${Date.now()}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to load quotes");
      const j = await res.json();
      if (Array.isArray(j.items) && j.items.length > 0) {
        // Merge into existing data by symbol
        setData((prev) => {
          const bySym = new Map(prev.map((p) => [p.symbol, p] as const));
          for (const raw of j.items as any[]) {
            const it: QuoteItem = {
              symbol: raw.symbol,
              shortName: raw.shortName || raw.symbol,
              price: Number(raw.price),
              change: Number(raw.change),
              changePercent: Number(raw.changePercent),
              currency: raw.currency,
            };
            if (!isFinite(it.price)) it.price = NaN;
            if (!isFinite(it.change)) it.change = NaN;
            if (!isFinite(it.changePercent)) it.changePercent = NaN;
            bySym.set(it.symbol, it);
          }
          // Keep ordering by SYMBOLS
          return SYMBOLS.map((s) => bySym.get(s)).filter(Boolean) as QuoteItem[];
        });
        // advance cursor
        setCursor((c) => (c + BATCH_SIZE) % SYMBOLS.length);
      } else {
        // Keep previous/placeholder data silently
      }
    } catch (e: any) {
      // Suppress banner; keep placeholders or last good data
    }
  };

  useEffect(() => {
    // Initial aggressive fill: fetch per-symbol sequentially to quickly populate
    (async () => {
      for (const sym of SYMBOLS) {
        try {
          const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(sym)}&_=${Date.now()}`,
            { cache: "no-store" }
          );
          const j = await res.json();
          if (Array.isArray(j.items) && j.items.length > 0) {
            setData((prev) => {
              const bySym = new Map(prev.map((p) => [p.symbol, p] as const));
              for (const raw of j.items as any[]) {
                const it: QuoteItem = {
                  symbol: raw.symbol,
                  shortName: raw.shortName || raw.symbol,
                  price: Number(raw.price),
                  change: Number(raw.change),
                  changePercent: Number(raw.changePercent),
                  currency: raw.currency,
                };
                if (!isFinite(it.price)) it.price = NaN;
                if (!isFinite(it.change)) it.change = NaN;
                if (!isFinite(it.changePercent)) it.changePercent = NaN;
                bySym.set(it.symbol, it);
              }
              return SYMBOLS.map((s) => bySym.get(s)).filter(Boolean) as QuoteItem[];
            });
          } else {
            // eslint-disable-next-line no-console
            console.debug("No items for", sym, j);
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.debug("quote error", sym, e);
        }
        await new Promise((r) => setTimeout(r, 150));
      }
    })();

    load();
    const id = setInterval(load, 15000); // refresh every 15s, rotating batches
    return () => clearInterval(id);
  }, []);

  const fmt = (v?: number) => (typeof v === 'number' && isFinite(v) ? v.toFixed(2) : '—');
  const renderItem = (i: QuoteItem, idx: number) => {
    const up = (i.change ?? 0) >= 0;
    return (
      <Link href={`/symbol/${encodeURIComponent(i.symbol)}`} key={`${i.symbol}-${idx}`} className="flex items-center gap-1 px-3 hover:bg-white/5">
        <span className="font-semibold">{i.shortName || i.symbol}</span>
        <span className="text-gray-200">{typeof i.price === 'number' && isFinite(i.price) ? `$${i.price.toFixed(2)}` : '—'}</span>
        <span className={up ? "text-green-400" : "text-red-400"}>
          {typeof i.change === 'number' && isFinite(i.change) ? (up ? "+" : "") + fmt(i.change) : "—"} ({typeof i.changePercent === 'number' && isFinite(i.changePercent) ? fmt(i.changePercent) : "—"}%)
        </span>
      </Link>
    );
  };

  const marqueeItems = [...data, ...data]; // duplicate for seamless loop
  return (
    <div className="w-full bg-black text-white text-xs sm:text-sm overflow-hidden">
      <div className="whitespace-nowrap">
        <div className="inline-flex animate-marquee will-change-transform">
          {marqueeItems.map((i, idx) => renderItem(i, idx))}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
}
