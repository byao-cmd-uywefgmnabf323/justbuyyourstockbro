"use client";
import React from "react";
import Link from "next/link";
import { useWatchlistStore } from "@/lib/store";

export default function WatchlistPage() {
  const { watchlist, removeFromWatchlist } = useWatchlistStore();

  return (
    <main className="min-h-screen py-10 bg-background">
      <div className="w-full max-w-laptop mx-auto px-4">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center border border-gray-900 bg-white text-black px-3 py-1.5 text-sm rounded-none hover:opacity-80">
            ← Back to Dashboard
          </Link>
          <div className="text-sm text-black">{watchlist.length} items</div>
        </div>

        <header className="mb-6">
          <h1 className="text-2xl font-bold text-black">Watchlist</h1>
          <p className="text-sm text-black mt-1">All stocks you have added to your watchlist.</p>
        </header>

        {watchlist.length === 0 ? (
          <div className="border border-gray-300 bg-white p-6 text-center text-black">
            Your watchlist is empty. Go to <Link href="/dashboard" className="underline">Dashboard</Link> or <Link href="/" className="underline">Home</Link> to add ideas.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {watchlist.map((w) => (
              <div key={w.symbol} className="bg-white border border-gray-300 p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Link href={`/symbol/${encodeURIComponent(w.symbol)}`} className="group">
                    <div className="font-semibold text-black group-hover:underline">{w.symbol}</div>
                    <div className="text-xs text-black/80">{w.name}</div>
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
                  <div className="text-xs">24h {w.change1D} · 1W {w.change1W} · 1M {w.change1M}</div>
                </div>
                {w.reasoning && (
                  <div className="text-xs text-black/90 line-clamp-3">{w.reasoning}</div>
                )}
                {typeof w.rating === 'number' && (
                  <div className="text-xs text-black/80">Rating: {"★".repeat(Math.round(w.rating))}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
