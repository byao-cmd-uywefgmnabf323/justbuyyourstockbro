"use client";
import React from "react";
import Link from "next/link";
import { useWatchlistStore } from "@/lib/store";

export default function Watchlist() {
  const { watchlist, removeFromWatchlist } = useWatchlistStore();

  return (
    <section className="border border-gray-300 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-black">Watchlist</h2>
        <Link href="/watchlist" className="text-sm text-black hover:underline">View All ({watchlist.length})</Link>
      </div>
      {watchlist.length === 0 ? (
        <p className="text-sm text-black">Your watchlist is empty.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {watchlist.slice(0, 6).map((w) => (
            <div key={w.symbol} className="bg-white border border-gray-300 p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Link href={`/symbol/${encodeURIComponent(w.symbol)}`} className="group">
                  <div className="font-semibold text-black group-hover:underline">{w.symbol}</div>
                  <div className="text-xs text-black/80 truncate">{w.name}</div>
                </Link>
                <button
                  className="text-xs text-white bg-charcoal hover:bg-charcoal/90 rounded-none px-2 py-1 border border-gray-900"
                  onClick={() => removeFromWatchlist(w.symbol)}
                  aria-label={`Remove ${w.symbol} from watchlist`}
                >
                  Remove
                </button>
              </div>
              <div className="text-sm text-black">
                <div className="font-mono">${w.price.toFixed ? w.price.toFixed(2) : w.price}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
