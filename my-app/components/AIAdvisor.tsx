"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWatchlistStore, Recommendation } from "@/lib/store";

// Minimal profile shape; extend as needed
type Profile = {
  risk?: "low" | "medium" | "high";
  horizon?: "short" | "medium" | "long";
  sectors?: string[];
  notes?: string;
};

type AdviceAction =
  | { type: "recommend_stocks"; data: Array<{ symbol: string; reason?: string; fit_score?: number }> }
  | { type: "navigate"; data: { to: string } }
  | { type: "add_to_watchlist"; data: { symbol: string } };

export default function AIAdvisor() {
  const router = useRouter();
  const { addToWatchlist } = useWatchlistStore();

  const [profile, setProfile] = useState<Profile>({ risk: "medium", horizon: "long", sectors: [] });
  const [actions, setActions] = useState<AdviceAction[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = async (symbol: string) => {
    try {
      const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(symbol)}`, { cache: "no-store" });
      const j = await res.json();
      const it = Array.isArray(j.items) && j.items.length ? j.items[0] : null;
      return it as { symbol: string; shortName?: string; price?: number } | null;
    } catch {
      return null;
    }
  };

  const execute = async (acts: AdviceAction[]) => {
    for (const a of acts) {
      if (a.type === "navigate") {
        router.push(a.data.to);
      } else if (a.type === "add_to_watchlist") {
        const sym = a.data.symbol;
        const q = await fetchQuote(sym);
        const rec: Recommendation = {
          type: "AI",
          symbol: sym,
          name: q?.shortName || sym,
          price: typeof q?.price === "number" ? q!.price : 0,
          change1D: "-",
          change1W: "-",
          change1M: "-",
          reasoning: "Added by AI advisor",
        };
        addToWatchlist(rec);
      }
    }
  };

  const onGetAdvice = async () => {
    try {
      setLoading(true);
      setError(null);
      setActions(null);
      const res = await fetch("/api/ai/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Advisor failed");
      const acts = (json?.actions ?? []) as AdviceAction[];
      setActions(acts);
    } catch (e: any) {
      setError(e?.message || "Failed to get advice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-black">AI Advisor</h2>
        <button
          className="text-sm text-black bg-white border border-gray-900 hover:bg-black/5 rounded-md px-3 py-1"
          disabled={loading}
          onClick={onGetAdvice}
        >
          {loading ? "Getting Picks…" : "Get Picks"}
        </button>
      </div>

      {/* Profile inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-sm">
        <div>
          <label className="block text-black mb-1">Risk</label>
          <select
            className="w-full border p-2 bg-white"
            value={profile.risk}
            onChange={(e) => setProfile((p) => ({ ...p, risk: e.target.value as Profile["risk"] }))}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="block text-black mb-1">Horizon</label>
          <select
            className="w-full border p-2 bg-white"
            value={profile.horizon}
            onChange={(e) => setProfile((p) => ({ ...p, horizon: e.target.value as Profile["horizon"] }))}
          >
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </div>
        <div>
          <label className="block text-black mb-1">Sectors (comma separated)</label>
          <input
            className="w-full border p-2 bg-white"
            placeholder="tech, healthcare"
            value={(profile.sectors || []).join(", ")}
            onChange={(e) => setProfile((p) => ({ ...p, sectors: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
          />
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-black mb-1 text-sm">Notes</label>
        <textarea
          className="w-full border p-2 bg-white text-sm"
          rows={2}
          placeholder="Any constraints or preferences"
          value={profile.notes || ""}
          onChange={(e) => setProfile((p) => ({ ...p, notes: e.target.value }))}
        />
      </div>

      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      {Array.isArray(actions) && actions.length > 0 && (
        <div className="mt-3">
          <h3 className="font-semibold text-black mb-2 text-sm">Recommendations</h3>
          <ul className="space-y-2 text-sm">
            {actions.filter(a => a.type === "recommend_stocks").flatMap(a => (a as any).data as any[]).map((it, idx) => (
              <li key={idx} className="flex items-center justify-between border p-2 bg-white">
                <div>
                  <div className="font-semibold text-black">{it.symbol} <span className="text-black">{typeof it.fit_score === "number" ? `· fit ${(it.fit_score*100).toFixed(0)}%` : ""}</span></div>
                  <div className="text-black">{it.reason || "—"}</div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs underline text-black" onClick={() => router.push(`/symbol/${encodeURIComponent(it.symbol)}`)}>Open</button>
                  <button className="text-xs underline text-black" onClick={() => execute([{ type: "add_to_watchlist", data: { symbol: it.symbol } }])}>Add to Watchlist</button>
                </div>
              </li>
            ))}
          </ul>
          {/* Execute any additional actions (navigate/add) suggested by the model */}
          <div className="mt-3">
            <button className="text-sm text-white bg-charcoal hover:bg-charcoal/90 rounded-md px-3 py-1" onClick={() => execute(actions!)}>
              Execute Suggested Actions
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
