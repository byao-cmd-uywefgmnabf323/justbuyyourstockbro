"use client";
import React from "react";
import AIAdvisor from "@/components/AIAdvisor";
import Recommendations from "@/components/Recommendations";
import StockSearch from "@/components/StockSearch";

export default function HomePage() {
  return (
    <main className="min-h-screen py-10 bg-background">
      <div className="w-full max-w-laptop mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <p className="text-sm text-black mt-1">Your personalized overview, recommendations, and watchlist.</p>
        </header>

        <div className="space-y-6">
          <AIAdvisor />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <Recommendations />
            </div>
            <div className="lg:col-span-1">
              <section className="border border-gray-300 bg-white p-4">
                <h2 className="font-semibold text-black mb-2">Search</h2>
                <StockSearch />
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
