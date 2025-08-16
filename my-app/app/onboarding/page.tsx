"use client";
import React, { useState } from "react";
import PriceChart from "@/components/PriceChart";
import { useWatchlistStore, Recommendation } from "@/lib/store";

interface SuggestionRequest {
  riskTolerance: string;
  timeHorizon: string;
  style: string;
  experience: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState<"form" | "results">("form");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<SuggestionRequest>({
    riskTolerance: "",
    timeHorizon: "",
    style: "",
    experience: "",
  });
  const [suggestions, setSuggestions] = useState<Recommendation[]>([]);
  const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlistStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/screener/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setSuggestions(data.suggestions);
      setStep("results");
    } catch (err) {
      alert("Failed to fetch suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "form") {
    return (
      <main className="min-h-screen py-10 bg-background">
        <div className="w-full max-w-laptop mx-auto px-4">
          <div className="card text-center">
            <h2 className="text-2xl font-bold mb-2 text-charcoal">Welcome to JustBuyYourStockBro</h2>
            <p className="mb-6 text-black">Let's get to know your investing style and goals!</p>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block font-semibold mb-1">Risk Tolerance <span className="text-black text-xs">(Low, Medium, High)</span></label>
                <input name="riskTolerance" value={form.riskTolerance} onChange={handleChange} required className="input" placeholder="e.g. Medium" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Time Horizon <span className="text-black text-xs">(1Y, 5Y, etc)</span></label>
                <input name="timeHorizon" value={form.timeHorizon} onChange={handleChange} required className="input" placeholder="e.g. 3Y" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Style <span className="text-black text-xs">(Growth, Value, etc)</span></label>
                <input name="style" value={form.style} onChange={handleChange} required className="input" placeholder="e.g. Growth" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Experience <span className="text-black text-xs">(Beginner, Advanced, etc)</span></label>
                <input name="experience" value={form.experience} onChange={handleChange} required className="input" placeholder="e.g. Beginner" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? "Loading..." : "Get Recommendations"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // Results step
  return (
    <main className="min-h-screen py-10 bg-background">
      <div className="w-full max-w-laptop mx-auto px-4">
        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-2 text-charcoal">Personalized Recommendations</h2>
          <p className="mb-6 text-black">Based on your profile, here are some picks for you. Add any to your watchlist!</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {suggestions.map((rec, idx) => {
            const inWatchlist = watchlist.some((w) => w.symbol === rec.symbol);
            const key = `${rec.type}-${rec.symbol}-${idx}`;
            return (
              <div key={key} className="border border-border rounded-lg p-4 bg-white flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-charcoal text-lg">{rec.symbol}</span>
                  <span className="text-black text-sm">{rec.name}</span>
                </div>
                <div className="flex gap-3 text-foreground justify-center">
                  <span>Price: <span className="font-semibold">${rec.price}</span></span>
                  <span>1D: <span className="font-semibold">{rec.change1D}</span></span>
                  <span>1W: <span className="font-semibold">{rec.change1W}</span></span>
                  <span>1M: <span className="font-semibold">{rec.change1M}</span></span>
                </div>
                {typeof rec.rating === "number" && (
                  <div className="text-xs text-charcoal text-center">
                    <span className="font-semibold">Rating:</span>{" "}
                    <span aria-label={`Rating ${rec.rating} out of 5`}>
                      {"★".repeat(Math.max(0, Math.min(5, Math.round(rec.rating))))}
                      {"☆".repeat(Math.max(0, 5 - Math.round(rec.rating)))}
                    </span>
                    <span className="ml-1">({rec.rating}/5)</span>
                  </div>
                )}
                <div className="text-black text-sm mb-2">{rec.reasoning}</div>
                {/* Always show chart */}
                <div className="mt-3">
                  <PriceChart symbol={rec.type === "forex" ? `${rec.symbol}=X` : rec.symbol} range="6mo" interval="1d" height={200} />
                </div>
                <div className="flex justify-center">
                  <button
                    className={`px-4 py-2 rounded font-semibold transition text-white ${inWatchlist ? "bg-gray-700 hover:opacity-90" : "bg-foreground hover:opacity-90"}`}
                    onClick={() => inWatchlist ? removeFromWatchlist(rec.symbol) : addToWatchlist(rec)}
                  >
                    {inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                  </button>
                </div>
              </div>
            );
          })}
          </div>
          <div className="mt-8 text-center">
            <a href="/dashboard" className="btn-primary inline-block">Go to Dashboard</a>
          </div>
        </div>
      </div>
    </main>
  );
}
