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
        <div className="mb-4">
          <Link href="/" className="inline-flex items-center border border-gray-900 bg-white text-black px-3 py-1.5 text-sm rounded-none hover:opacity-80">
            ← Back to Home
          </Link>
        </div>
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <p className="text-sm text-black mt-1">Your personalized overview, recommendations, and watchlist.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* AI Advisor */}
          <section className="lg:col-span-2 border border-white bg-white p-4">
            <AIAdvisor />
          </section>
          {/* Recommendation Summary (placeholder) */}
          <section className="lg:col-span-2 border border-gray-300 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-black">Recommendations</h2>
              <a href="/onboarding" className="text-sm text-black hover:underline">Update Profile</a>
            </div>
            <p className="text-sm text-black">Generate new picks from your profile on the onboarding page. Coming soon: inline generation here.</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-gray-300 text-black">[Ticker] | $Price | 24h %</div>
              <div className="p-3 bg-white border border-gray-300 text-black">[Ticker] | $Price | 24h %</div>
            </div>
          </section>
          {/* Note: Watchlist moved to dedicated /watchlist page */}
          {/* Search */}
          <section className="lg:col-span-1 border border-gray-300 bg-white p-4">
            <h2 className="font-semibold text-black mb-2">Search</h2>
            <StockSearch />
          </section>
        </div>
      </div>
    </main>
  );
}
