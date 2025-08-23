"use client";
import React from "react";
import Link from "next/link";
import AIAdvisor from "@/components/AIAdvisor";
import Watchlist from "@/components/Watchlist";
import Backtest from "@/components/Backtest";
import Profile from "@/components/Profile";
import StockSearch from "@/components/StockSearch";

export default function DashboardPage() {
  return (
    <main className="min-h-screen py-10 bg-background">
      <div className="w-full max-w-laptop mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <p className="text-sm text-black mt-1">Your personalized overview, recommendations, and watchlist.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <AIAdvisor />
            <Watchlist />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Backtest />
            <Profile />
            <section className="border border-gray-300 bg-white p-4">
              <h2 className="font-semibold text-black mb-2">Search</h2>
              <StockSearch />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
