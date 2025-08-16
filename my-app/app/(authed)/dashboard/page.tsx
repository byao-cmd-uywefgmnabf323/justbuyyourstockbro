"use client";
import React from "react";
import Link from "next/link";
import { useWatchlistStore } from "@/lib/store";
import StockSearch from "@/components/StockSearch";
import AIAdvisor from "@/components/AIAdvisor";

export default function DashboardPage() {
  const { watchlist, removeFromWatchlist } = useWatchlistStore();

  return (
    <main className="min-h-screen py-10 bg-background">
      <div className="w-full max-w-laptop mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <p className="text-sm text-black mt-1">Your personalized overview, recommendations, and watchlist.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* AI Advisor */}
        <section className="card lg:col-span-2">
          <AIAdvisor />
        </section>
        {/* Recommendation Summary (placeholder) */}
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-black">Recommendations</h2>
            <a href="/onboarding" className="text-sm text-black hover:underline">Update Profile</a>
          </div>
          <p className="text-sm text-black">Generate new picks from your profile on the onboarding page. Coming soon: inline generation here.</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg p-3 bg-background">[Ticker] | $Price | 24h %</div>
            <div className="rounded-lg p-3 bg-background">[Ticker] | $Price | 24h %</div>
          </div>
        </section>

        {/* Watchlist */}
        <section className="card lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-black">Watchlist</h2>
            <span className="text-xs text-black">{watchlist.length} items</span>
          </div>
          {watchlist.length === 0 ? (
            <p className="text-sm text-black">Your watchlist is empty. Add items from recommendations.</p>
          ) : (
            <ul className="divide-y divide-border">
              {watchlist.map((w) => (
                <li key={w.symbol} className="py-3 flex items-center justify-between">
                  <Link href={`/symbol/${encodeURIComponent(w.symbol)}`} className="group">
                    <div className="font-semibold text-black group-hover:underline">
                      {w.symbol} <span className="text-xs text-black">{w.name}</span>
                    </div>
                    <div className="text-sm text-black">${w.price} · 24h {w.change1D}</div>
                  </Link>
                  <button
                    className="text-sm text-white bg-charcoal hover:bg-charcoal/90 rounded-md px-3 py-1"
                    onClick={() => removeFromWatchlist(w.symbol)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Search */}
        <section className="card lg:col-span-1">
          <h2 className="font-semibold text-black mb-2">Search</h2>
          <StockSearch />
        </section>
        </div>
      </div>
    </main>
  );
}
