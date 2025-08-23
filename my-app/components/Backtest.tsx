"use client";
import React from "react";
import Link from "next/link";

export default function Backtest() {
  return (
    <section className="border border-gray-300 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-black">AI Backtesting</h2>
        <Link href="/backtest" className="text-sm text-black hover:underline">Full Tool</Link>
      </div>
      <p className="text-sm text-black">Describe a strategy and timeframe. We'll generate a high-level, AI-driven backtest summary.</p>
      <div className="mt-3">
        <Link href="/backtest" className="inline-flex items-center border border-gray-900 bg-black text-white px-4 py-2 rounded-none text-sm">
          Run a Backtest
        </Link>
      </div>
    </section>
  );
}
