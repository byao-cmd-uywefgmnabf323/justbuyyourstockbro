"use client";
import React, { useState } from "react";
import PriceChart from "@/components/PriceChart";

const experienceLevels = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Expert", value: "expert" },
];

const tradingStyles = [
  { label: "Day Trading", value: "day" },
  { label: "Swing", value: "swing" },
  { label: "Long-Term", value: "longterm" },
  { label: "Value", value: "value" },
  { label: "Growth", value: "growth" },
];

export default function UserProfileDashboard() {
  const [experience, setExperience] = useState("beginner");
  const [style, setStyle] = useState<string[]>([]);
  const [risk, setRisk] = useState(1);
  const [goal, setGoal] = useState("");
  const [expDetails, setExpDetails] = useState("");
  const [horizon, setHorizon] = useState("6M");
  const [sectors, setSectors] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | "equity" | "crypto" | "forex">("all");

  const riskLevels = ["Low", "Medium", "High"];

  const toggleStyle = (val: string) => {
    setStyle((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    );
  };

  const toggleSector = (val: string) => {
    setSectors((prev) => (prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]));
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const body = {
        riskTolerance: riskLevels[risk].toLowerCase(),
        timeHorizon: horizon,
        style, // allow multiple styles
        experience,
        experienceDetails: expDetails,
        goal,
        sectors,
      };
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResults(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch recommendations");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (sym: string) =>
    setExpanded((s) => ({ ...s, [sym]: !s[sym] }));

  const filtered = results.filter((r) => (filter === "all" ? true : r.type === filter));

  return (
    <main className="min-h-screen flex flex-col items-center py-10 bg-background">
      <div className="w-full max-w-laptop px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-charcoal">JUST BUY YOUR STOCK BRO</h1>
          <p className="text-black mb-4 text-sm">
            Set your experience, trading style, risk tolerance, and investment goal for personalized recommendations.
          </p>
        </div>
        {/* Experience Level Selector */}
        <div className="card mb-6 text-center">
          <div className="font-semibold mb-2 text-charcoal">Experience Level</div>
          <div className="flex gap-2 justify-center">
            {experienceLevels.map((lvl) => (
              <button
                key={lvl.value}
                type="button"
                className={`px-4 py-2 rounded-none font-medium transition text-sm border ${experience === lvl.value ? "bg-foreground text-white border-gray-900" : "bg-white text-charcoal border-gray-300 hover:border-gray-500"}`}
                onClick={() => setExperience(lvl.value)}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>
        {/* Trading Style Cards */}
        <div className="card mb-6 text-center">
          <div className="font-semibold mb-2 text-charcoal">Trading Style</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 place-items-center">
            {tradingStyles.map((ts) => (
              <button
                key={ts.value}
                type="button"
                className={`px-4 py-3 rounded-none font-medium transition text-sm border flex items-center justify-center ${style.includes(ts.value) ? "bg-foreground text-white border-gray-900" : "bg-white text-charcoal border-gray-300 hover:border-gray-500"}`}
                onClick={() => toggleStyle(ts.value)}
              >
                {ts.label}
              </button>
            ))}
          </div>
        </div>
        {/* Time Horizon & Sectors */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="font-semibold mb-2 text-charcoal">Investment Horizon</div>
              <select
                className="w-full border border-gray-300 bg-white text-charcoal px-3 py-2 rounded-none"
                value={horizon}
                onChange={(e) => setHorizon(e.target.value)}
              >
                <option value="3M">3 Months</option>
                <option value="6M">6 Months</option>
                <option value="1Y">1 Year</option>
                <option value="3Y">3 Years</option>
                <option value="5Y">5+ Years</option>
              </select>
            </div>
            <div>
              <div className="font-semibold mb-2 text-charcoal">Preferred Sectors</div>
              <div className="flex flex-wrap gap-2">
                {["Tech","Healthcare","Energy","Finance","Consumer","Industrial"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`px-3 py-1 border rounded-none text-sm ${sectors.includes(s) ? "bg-foreground text-white border-gray-900" : "bg-white text-charcoal border-gray-300 hover:border-gray-500"}`}
                    onClick={() => toggleSector(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Experience details textbox */}
        <div className="card mb-6">
          <div className="font-semibold mb-2 text-charcoal">Tell us about your experience</div>
          <textarea
            value={expDetails}
            onChange={(e) => setExpDetails(e.target.value.slice(0, 500))}
            placeholder="Share your trading experience, constraints, sectors you like/avoid, position sizes, and anything else."
            className="w-full border border-gray-300 bg-white text-charcoal p-3 min-h-[96px] rounded-none"
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1 text-right">{expDetails.length}/500</div>
        </div>
        {/* Risk Tolerance Slider */}
        <div className="card mb-6 text-center">
          <div className="font-semibold mb-2 text-charcoal">Risk Tolerance</div>
          <div className="flex items-center gap-3 justify-center">
            <span className="text-xs text-gray-500">Low</span>
            <input
              type="range"
              min={0}
              max={2}
              value={risk}
              onChange={(e) => setRisk(Number(e.target.value))}
              className="w-64 accent-gray-700"
            />
            <span className="text-gray-900 font-semibold text-center mt-1 w-16">{riskLevels[risk]}</span>
          </div>
        </div>
        {/* Investment Goal Input */}
        <div className="card mb-4 text-center">
          <div className="font-semibold mb-2 text-charcoal">Investment Goal</div>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value.slice(0, 80))}
            placeholder="e.g. Grow my savings by 20% in 2 years"
            maxLength={80}
            className="input"
          />
          <div className="text-xs text-gray-500 text-center mt-1">{goal.length}/80</div>
        </div>
        {/* CTA */}
        <button
          className="w-full py-3 rounded-none bg-foreground text-white font-bold text-lg shadow-card hover:opacity-90 transition disabled:opacity-60"
          onClick={generate}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Recommendations"}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 text-sm text-red-600">{error}</div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold mb-3 text-charcoal text-center">Recommendations</h2>
            {/* Filter buttons */}
            <div className="mb-4 flex items-center justify-center gap-2">
              {([
                { label: "All", val: "all" },
                { label: "Stocks", val: "equity" },
                { label: "Crypto", val: "crypto" },
                { label: "Forex", val: "forex" },
              ] as const).map((b) => (
                <button
                  key={b.val}
                  type="button"
                  onClick={() => setFilter(b.val)}
                  className={`px-3 py-2 border rounded-none text-sm ${
                    filter === b.val
                      ? "bg-foreground text-white border-gray-900"
                      : "bg-white text-charcoal border-gray-300 hover:border-gray-500"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {filtered.map((rec) => (
                <div key={`${rec.type}-${rec.symbol}`} className="card text-center">
                  <div className="mb-1 font-bold text-charcoal">
                    {rec.symbol} <span className="text-sm font-normal text-black">{rec.name}</span>
                  </div>
                  {/* type badge */}
                  <div className="mb-2 text-xs">
                    <span className="inline-block px-2 py-0.5 border border-gray-400 rounded-none text-gray-700 bg-gray-100">
                      {rec.type === "equity" ? "Stock" : rec.type === "crypto" ? "Crypto" : "Forex"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">${rec.price}</span>
                    <span className={`ml-2 ${String(rec.change1D).startsWith("-") ? "text-red-600" : "text-green-600"}`}>{rec.change1D}</span>
                  </div>
                  {/* Rating */}
                  {typeof rec.rating === "number" && (
                    <div className="mt-1 text-xs text-charcoal">
                      <span className="font-semibold">Rating:</span>{" "}
                      <span aria-label={`Rating ${rec.rating} out of 5`}>
                        {"★".repeat(Math.max(0, Math.min(5, Math.round(rec.rating))))}
                        {"☆".repeat(Math.max(0, 5 - Math.round(rec.rating)))}
                      </span>
                      <span className="ml-1">({rec.rating}/5)</span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-center gap-2 text-xs text-black">
                    <span>24h {rec.change1D}</span>
                    <span>· 1W {rec.change1W}</span>
                    <span>· 1M {rec.change1M}</span>
                  </div>
                  {expanded[rec.symbol] && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-gray-100 border border-gray-300">
                        <div className="text-xs text-black">P/E Ratio</div>
                        <div className="font-semibold">{rec.pe ?? "—"}</div>
                      </div>
                      <div className="p-3 bg-gray-100 border border-gray-300">
                        <div className="text-xs text-black">EPS</div>
                        <div className="font-semibold">{rec.eps ?? "—"}</div>
                      </div>
                      <div className="p-3 bg-gray-100 border border-gray-300">
                        <div className="text-xs text-black">Dividend Yield</div>
                        <div className="font-semibold">{rec.dy ?? "—"}%</div>
                      </div>
                      <div className="sm:col-span-3 text-sm text-black text-center">
                        <span className="font-semibold">Strategy Alignment:</span> {rec.reasoning}
                      </div>
                      <div className="sm:col-span-3 text-center">
                        <span className="text-xs text-black">Signal:</span>{" "}
                        <span className={`ml-1 text-sm font-semibold ${rec.signal === "Buy" ? "text-green-600" : rec.signal === "Sell" ? "text-red-600" : "text-yellow-600"}`}>{rec.signal || "Hold"}</span>
                      </div>
                      {/* Chart */}
                      <div className="sm:col-span-3">
                        <PriceChart symbol={rec.type === "forex" ? `${rec.symbol}=X` : rec.symbol} range="6mo" interval="1d" height={220} />
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex justify-center items-center">
                    <button
                      className="text-sm text-gray-900 hover:opacity-80"
                      onClick={() => toggleExpand(rec.symbol)}
                    >
                      {expanded[rec.symbol] ? "Hide details" : "Show details"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
