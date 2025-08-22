"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PriceChart from "@/components/PriceChart";
import InlineDef from "@/components/InlineDef";
import ChatBox from "@/components/ChatBox";

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

export default function ChatPage() {
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
  const [other, setOther] = useState<any[]>([]);
  const [showOther, setShowOther] = useState(true);
  const [showIntro, setShowIntro] = useState(false);

  // Show intro notice on first load if not dismissed
  useEffect(() => {
    try {
      const w = typeof window !== 'undefined' ? window : undefined;
      const flag = w ? w.localStorage.getItem("jbysb_intro_dismissed") : "1";
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const force = params.get("intro") === "1";
      if (force) setShowIntro(true);
      else setShowIntro(flag !== "1");
    } catch {}
  }, []);

  const [otherLoading, setOtherLoading] = useState(false);
  const [otherLoadedCount, setOtherLoadedCount] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | "equity" | "crypto" | "forex">("all");

  // Merge live quotes into recommendation results (price, change1D, P/E, EPS, DY, Beta, 52W High/Low, name)
  const mergeLiveForResults = async (baseResults: any[]) => {
    if (!Array.isArray(baseResults) || baseResults.length === 0) return baseResults;
    const symbols = baseResults.map((r:any)=> String((r as any).symbol)).filter(Boolean);
    if (!symbols.length) return baseResults;
    try {
      const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(symbols.join(","))}&_=${Date.now()}`, { cache: "no-store" });
      const j = await res.json();
      if (!Array.isArray(j.items)) return baseResults;
      const liveMap = new Map(j.items.map((q:any)=>[(q as any).symbol, q]));
      return baseResults.map((r:any)=>{
        const live = liveMap.get(String((r as any).symbol));
        if (!live) return r;
        const name = (r as any).name ?? (live as any).longName ?? (live as any).shortName ?? (r as any).symbol;
        const dyLive = typeof (live as any).dividendYield === 'number' && isFinite((live as any).dividendYield) ? (live as any).dividendYield : undefined;
        return {
          ...(r as any),
          name,
          price: Number.isFinite((live as any).price) ? (live as any).price : (r as any).price,
          change1D: typeof (live as any).changePercent==='number'? `${(live as any).changePercent.toFixed(2)}%` : (r as any).change1D,
          pe: typeof (live as any).trailingPE==='number' && isFinite((live as any).trailingPE) ? (live as any).trailingPE : (r as any).pe,
          eps: typeof (live as any).epsTTM==='number' && isFinite((live as any).epsTTM) ? (live as any).epsTTM : (r as any).eps,
          dy: dyLive ?? (r as any).dy,
          beta: typeof (live as any).beta==='number' && isFinite((live as any).beta) ? (live as any).beta : (r as any).beta,
          high52w: typeof (live as any).fiftyTwoWeekHigh==='number' ? (live as any).fiftyTwoWeekHigh : (r as any).high52w,
          low52w: typeof (live as any).fiftyTwoWeekLow==='number' ? (live as any).fiftyTwoWeekLow : (r as any).low52w,
        };
      });
    } catch { return baseResults; }
  };

  // Compute 1D/1W/1M from history once per recommendation set (not every second)
  const computeHistoryChangesForResults = async (baseResults: any[]) => {
    if (!Array.isArray(baseResults) || baseResults.length === 0) return baseResults;
    const out = [...baseResults];
    const syms = out.map((r:any)=>String(r.symbol)).filter(Boolean);
    const concurrency = 4;
    let idx = 0;
    const worker = async () => {
      while (idx < syms.length) {
        const i = idx++;
        const sym = syms[i];
        try {
          const hres = await fetch(`/api/market/history?symbol=${encodeURIComponent(sym)}&range=6mo&interval=1d&_=${Date.now()}`, { cache: "no-store" });
          const hjson = await hres.json();
          const cs = Array.isArray(hjson.items) ? hjson.items : (Array.isArray(hjson.candles) ? hjson.candles : []);
          if (cs.length >= 2) {
            const last = Number(cs[cs.length - 1]?.c);
            const d1 = Number(cs[cs.length - 2]?.c);
            const w1 = Number(cs[cs.length - 6]?.c);
            const m1 = Number(cs[cs.length - 22]?.c);
            const pct = (a:number,b:number)=> (isFinite(a) && isFinite(b) && b!==0 ? ((a-b)/b)*100 : NaN);
            const p1 = pct(last, d1);
            const p7 = pct(last, w1);
            const p21 = pct(last, m1);
            const j = out.find((r:any)=>String(r.symbol)===sym);
            if (j) {
              if (!j.change1D || j.change1D === '—') { if (isFinite(p1)) j.change1D = `${p1.toFixed(2)}%`; }
              if (!j.change1W || j.change1W === '—') { if (isFinite(p7)) j.change1W = `${p7.toFixed(2)}%`; }
              if (!j.change1M || j.change1M === '—') { if (isFinite(p21)) j.change1M = `${p21.toFixed(2)}%`; }
            }
          }
        } catch {}
      }
    };
    await Promise.all(Array.from({length: Math.min(concurrency, syms.length)}, ()=>worker()));
    return out;
  };

  const riskLevels = ["Low", "Medium", "High"];

  const dismissIntro = () => {
    try {
      window.localStorage.setItem("jbysb_intro_dismissed", "1");
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('intro');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
    setShowIntro(false);
  };

  // --- Chat-first UI ---
  return (
    <main className="min-h-screen flex flex-col items-center justify-center min-h-screen bg-background px-4">
      {/* Mission Notice Box */}
      {showIntro && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40">
          <div className="mt-20 w-full max-w-2xl bg-white border border-gray-300 shadow-2xl p-5">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-black">Welcome to JustBuyYourStockBro</h2>
            </div>
            <div className="mt-3 text-sm text-black space-y-2">
              <p><span className="font-semibold">Mission:</span> help retail investors cut noise with personalized, explainable stock ideas and quick AI validation.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><span className="font-semibold">Personalized Picks:</span> survey your style, risk, horizon, sectors + context to tailor recommendations.</li>
                <li><span className="font-semibold">Explainable Reasons:</span> symbol pages include concise AI bullets under Key Stats.</li>
                <li><span className="font-semibold">Other Stocks:</span> keep a broad universe visible for discovery, not just AI’s top picks.</li>
                <li><span className="font-semibold">AI Backtesting:</span> try strategies on <a className="underline" href="/backtest">/backtest</a> for quick metrics (CAGR, Sharpe, drawdown).</li>
              </ul>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={dismissIntro} className="px-4 py-2 border border-gray-900 bg-black text-white rounded-none">Got it</button>
            </div>
          </div>
        </div>
      )}
      <h1 className="text-3xl font-bold mb-6 text-charcoal">JUST BUY YOUR STOCK BRO</h1>
      <ChatBox />
      <p className="mt-6 text-xs text-gray-500 max-w-xl text-center">
        Remember, Anchor is here for education and ideas, not financial advice. Perform your own research or consult a licensed advisor before investing.
      </p>
    </main>
  );

  const toggleStyle = (val: string) => {
    setStyle((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    );
  };

  const toggleSector = (val: string) => {
    setSectors((prev) => (prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]));
  };

  // Isolated controller to comply with Next.js Suspense requirement for useSearchParams
  function IntroController({ setShow }:{ setShow: (v:boolean)=>void }) {
    const params = useSearchParams();
    useEffect(() => {
      try {
        const w = typeof window !== 'undefined' ? window : undefined;
        const flag = w ? w.localStorage.getItem("jbysb_intro_dismissed") : "1";
        const force = params?.get("intro") === "1";
        if (force) setShow(true); else setShow(flag !== "1");
      } catch {}
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);
    return null;
  }

  // Baseline universe (same spirit as MarketBar: popular equities + crypto + a few forex)
  const BASE_UNIVERSE: string[] = [
    // Mega/large-cap equities
    "AAPL","MSFT","NVDA","TSLA","AMZN","GOOGL","META","AMD","NFLX","JPM",
    "V","MA","BAC","XOM","CVX","JNJ","PEP","KO","DIS","NKE",
    "HD","PG","UNH","LLY","ABBV","AVGO","COST","WMT","ORCL","CRM",
    "INTC","CSCO","ADBE","TXN","QCOM","SHOP","PYPL","SQ","UBER","ABNB",
    // Crypto (Yahoo suffix)
    "BTC-USD","ETH-USD","SOL-USD","DOGE-USD","ADA-USD","BNB-USD",
    // Forex (Yahoo uses =X)
    "EURUSD=X","USDJPY=X","GBPUSD=X","USDCHF=X",
  ];

  // Load baseline quotes and optionally exclude recommended symbols
  const loadBaseline = async (excludeSyms: string[]) => {
    try {
      const exclude = new Set(excludeSyms.map((s) => s.toUpperCase()));
      const universe = BASE_UNIVERSE.filter((s) => !exclude.has(s));
      if (!universe.length) {
        setOther([]);
        return;
      }
      // Seed placeholders so the UI shows immediately
      const placeholders = universe.map((sym) => ({
        type: sym.endsWith("-USD") ? "crypto" : sym.endsWith("=X") ? "forex" : "equity",
        symbol: sym,
        name: sym,
        price: null,
        change1D: "—",
        change1W: "—",
        change1M: "—",
        rating: undefined,
        pe: null,
        eps: null,
        dy: null,
        reasoning: "",
        signal: "Hold",
      }));
      setOther(placeholders);
      setOtherLoading(true);
      setOtherLoadedCount(0);
      const results: Record<string, any> = {};
      // Concurrent fetch with small pool
      const concurrency = 5;
      let index = 0;
      const worker = async () => {
        while (index < universe.length) {
          const i = index++;
          const sym = universe[i];
          try {
            const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(sym)}&_=${Date.now()}`, { cache: "no-store" });
            const j = await res.json();
            if (Array.isArray(j.items)) {
              for (const q of j.items) {
                results[q.symbol] = {
                  type: String(q.symbol).endsWith("-USD") ? "crypto" : String(q.symbol).endsWith("=X") ? "forex" : "equity",
                  symbol: q.symbol,
                  name: q.longName || q.shortName || q.symbol,
                  price: Number.isFinite(q.price) ? q.price : null,
                  change1D: typeof q.changePercent === 'number' ? `${q.changePercent.toFixed(2)}%` : "—",
                  change1W: "—",
                  change1M: "—",
                  rating: undefined,
                  pe: typeof (q as any).trailingPE === 'number' && isFinite((q as any).trailingPE) ? (q as any).trailingPE : null,
                  eps: typeof (q as any).epsTTM === 'number' && isFinite((q as any).epsTTM) ? (q as any).epsTTM : null,
                  dy: typeof (q as any).dividendYield === 'number' && isFinite((q as any).dividendYield) ? (q as any).dividendYield : null,
                  reasoning: "",
                  signal: "Hold",
                };
              }
            }
          } catch {}
          // Fallback: if price still null, fetch last close via history
          if (results[sym] && (results[sym].price === null || !isFinite(results[sym].price))) {
            try {
              const hres = await fetch(`/api/market/history?symbol=${encodeURIComponent(sym)}&range=5d&interval=1d&_=${Date.now()}`, { cache: "no-store" });
              const hjson = await hres.json();
              const candles = Array.isArray(hjson.items) ? hjson.items : (Array.isArray(hjson.candles) ? hjson.candles : []);
              if (candles.length) {
                const last = candles[candles.length - 1];
                if (last && typeof last.c === "number" && isFinite(last.c)) {
                  results[sym].price = last.c;
                }
              }
            } catch {}
          }
          // If change % or 1W/1M missing, compute from history on the fly
          if (results[sym] && (results[sym].change1D === "—" || results[sym].change1W === "—" || results[sym].change1M === "—")) {
            try {
              const hres2 = await fetch(`/api/market/history?symbol=${encodeURIComponent(sym)}&range=6mo&interval=1d&_=${Date.now()}`, { cache: "no-store" });
              const hjson2 = await hres2.json();
              const cs = Array.isArray(hjson2.items) ? hjson2.items : (Array.isArray(hjson2.candles) ? hjson2.candles : []);
              if (cs.length >= 2) {
                const last = Number(cs[cs.length - 1]?.c);
                const d1 = Number(cs[cs.length - 2]?.c);
                const w1 = Number(cs[cs.length - 6]?.c);
                const m1 = Number(cs[cs.length - 22]?.c);
                const pct = (a: number, b: number) => (isFinite(a) && isFinite(b) && b !== 0 ? ((a - b) / b) * 100 : NaN);
                const p1 = pct(last, d1);
                const p7 = pct(last, w1);
                const p21 = pct(last, m1);
                if (isFinite(p1)) results[sym].change1D = `${p1.toFixed(2)}%`;
                if (isFinite(p7)) results[sym].change1W = `${p7.toFixed(2)}%`;
                if (isFinite(p21)) results[sym].change1M = `${p21.toFixed(2)}%`;
              }
            } catch {}
          }
          // Debug (temporary): log resolved item
          try { if (results[sym]) console.debug('resolved', sym, 'price=', results[sym].price); } catch {}
          setOtherLoadedCount((c) => c + 1);
          // Light incremental UI update (optional, cheap)
          const partial = universe.map((s) => results[s] || placeholders.find(p => p.symbol === s));
          setOther(partial.filter(Boolean) as any[]);
        }
      };
      await Promise.all(Array.from({ length: Math.min(concurrency, universe.length) }, () => worker()));
      const ordered = universe.map((s) => results[s] || placeholders.find(p => p.symbol === s)).filter(Boolean);
      setOther(ordered);
    } catch {
      setOther([]);
    } finally {
      setOtherLoading(false);
    }
  };

  // Load initial universe on page load (before any AI call)
  useEffect(() => {
    loadBaseline([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const recs = Array.isArray(data.suggestions) ? data.suggestions : [];
      // initial merge with live quotes
      const merged = await mergeLiveForResults(recs);
      // compute history-based percent changes once
      const withPct = await computeHistoryChangesForResults(merged);
      setResults(withPct);
      // refresh baseline excluding recommended symbols (non-blocking)
      loadBaseline(recs.map((r: any) => String(r.symbol)));
    } catch (e: any) {
      setError(e?.message || "Failed to fetch recommendations");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (sym: string) =>
    setExpanded((s) => ({ ...s, [sym]: !s[sym] }));

  // Live polling to keep recommendation price/change in sync (1s)
  const recSymbolsKey = results.map(r=>String(r.symbol)).sort().join(',');
  useEffect(() => {
    let active = true;
    if (!recSymbolsKey) return;
    const tick = async () => {
      try {
        const updated = await mergeLiveForResults(results);
        if (active) setResults(updated);
      } catch {}
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => { active = false; window.clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recSymbolsKey]);

  const filtered = results.filter((r) => (filter === "all" ? true : r.type === filter));

  return (
    <Suspense fallback={null}>
    <main className="min-h-screen flex flex-col items-center py-10 bg-background">
      <div className="w-full max-w-laptop px-4">
        <Suspense fallback={null}><IntroController setShow={setShowIntro} /></Suspense>
        {showIntro && (
          <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40">
            <div className="mt-20 w-full max-w-2xl bg-white border border-gray-300 shadow-2xl p-5">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-bold text-black">Welcome to JustBuyYourStockBro</h2>
              </div>
              <div className="mt-3 text-sm text-black space-y-2">
                <p><span className="font-semibold">Mission:</span> help retail investors cut noise with personalized, explainable stock ideas and quick AI validation.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-semibold">Personalized Picks:</span> survey your style, risk, horizon, sectors + context to tailor recommendations.</li>
                  <li><span className="font-semibold">Explainable Reasons:</span> symbol pages include concise AI bullets under Key Stats.</li>
                  <li><span className="font-semibold">Other Stocks:</span> keep a broad universe visible for discovery, not just AI’s top picks.</li>
                  <li><span className="font-semibold">AI Backtesting:</span> try strategies on <a className="underline" href="/backtest">/backtest</a> for quick metrics (CAGR, Sharpe, drawdown).</li>
                </ul>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={dismissIntro} className="px-4 py-2 border border-gray-900 bg-black text-white rounded-none">Got it</button>
              </div>
            </div>
          </div>
        )}
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

        {/* Controls: Other Stocks toggle */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setShowOther((v) => !v)}
            className="px-3 py-2 border border-gray-900 bg-black text-white text-sm rounded-none"
          >
            {showOther ? "Hide Other Stocks" : "Show Other Stocks"}
          </button>
          <button
            type="button"
            onClick={() => loadBaseline(results.map((r: any) => String(r.symbol)))}
            className="px-3 py-2 border border-gray-900 bg-white text-black text-sm rounded-none"
            disabled={otherLoading}
          >
            Reload Other Stocks
          </button>
        </div>
        {/* Subtle progress indicator under toggle */}
        {otherLoading && (
          <div className="mt-1 text-center text-xs text-black">
            {`Loading Other Stocks… (${Math.round((otherLoadedCount / BASE_UNIVERSE.length) * 100)}%)`}
          </div>
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
                  <div className="mb-1 text-charcoal">
                    <span className="font-bold">{rec.symbol}</span>{' '}<span className="text-sm font-normal text-black">{rec.name}</span>
                  </div>
                  {/* type badge */}
                  <div className="mb-2 text-xs">
                    <span className="inline-block px-2 py-0.5 border border-gray-400 rounded-none text-gray-700 bg-gray-100">
                      {rec.type === "equity" ? "Stock" : rec.type === "crypto" ? "Crypto" : "Forex"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">{(() => { const pv = Number((rec as any).price); return isFinite(pv) ? `$${pv.toFixed(2)}` : '—'; })()}</span>
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
                  {/* Indicators under timeframes */}
                  <div className="mt-1 text-xs text-black">
                    <span>
                      <InlineDef label="P/E" term="P/E Ratio" definition="P/E compares a company’s price to its earnings; lower can imply cheaper valuation." href="/academy/pe-ratio" />{' '}
                      {typeof rec.pe === 'number' && isFinite(rec.pe) ? rec.pe.toFixed(1) : '—'}
                    </span>
                    <span className="ml-3">
                      <InlineDef label="EPS" term="EPS" definition="Earnings Per Share: a company’s profit divided by the number of shares." href="/academy/eps" />{' '}
                      {typeof rec.eps === 'number' && isFinite(rec.eps) ? rec.eps.toFixed(2) : '—'}
                    </span>
                    <span className="ml-3">
                      <InlineDef label="DY" term="Dividend Yield" definition="Annual dividends as a percentage of the share price." href="/academy/dividend-yield" />{' '}
                      {typeof rec.dy === 'number' && isFinite(rec.dy) ? `${rec.dy.toFixed(2)}%` : '—'}
                    </span>
                  </div>
                  {expanded[rec.symbol] && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-gray-100 border border-gray-300">
                        <div className="text-xs text-black">
                          <InlineDef label="P/E Ratio" term="P/E Ratio" definition="P/E compares a company’s price to its earnings; lower can imply cheaper valuation." href="/academy/pe-ratio" />
                        </div>
                        <div className="font-semibold">{rec.pe ?? "—"}</div>
                      </div>
                      <div className="p-3 bg-gray-100 border border-gray-300">
                        <div className="text-xs text-black">
                          <InlineDef label="EPS" term="EPS" definition="Earnings Per Share: a company’s profit divided by the number of shares." href="/academy/eps" />
                        </div>
                        <div className="font-semibold">{rec.eps ?? "—"}</div>
                      </div>
                      <div className="p-3 bg-gray-100 border border-gray-300">
                        <div className="text-xs text-black">
                          <InlineDef label="Dividend Yield" term="Dividend Yield" definition="Annual dividends as a percentage of the share price." href="/academy/dividend-yield" />
                        </div>
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

        {/* Other Stocks */}
        {showOther && other.length > 0 && (
          <section id="other-stocks" className="mt-10">
            <h2 className="text-lg font-semibold mb-3 text-charcoal text-center">Other Stocks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {other.map((rec) => (
                <div key={`other-${rec.symbol}`} className="card text-center">
                  <div className="mb-1 font-bold text-charcoal">
                    {rec.symbol} <span className="text-sm font-normal text-black">{rec.name}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">{(() => { const pv = Number((rec as any).price); return Number.isFinite(pv) ? `$${pv.toFixed(2)}` : '—'; })()}</span>
                    <span className={`ml-2 ${String(rec.change1D).startsWith("-") ? "text-red-600" : "text-green-600"}`}>{rec.change1D}</span>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-center gap-2 text-xs text-black">
                    <span>24h {rec.change1D}</span>
                    <span>· 1W {rec.change1W}</span>
                    <span>· 1M {rec.change1M}</span>
                  </div>
                  {/* Indicators under timeframes */}
                  <div className="mt-1 text-xs text-black">
                    <span>
                      <InlineDef label="P/E" term="P/E Ratio" definition="P/E compares a company’s price to its earnings; lower can imply cheaper valuation." href="/academy/pe-ratio" />{' '}
                      {typeof rec.pe === 'number' && isFinite(rec.pe) ? rec.pe.toFixed(1) : '—'}
                    </span>
                    <span className="ml-3">
                      <InlineDef label="EPS" term="EPS" definition="Earnings Per Share: a company’s profit divided by the number of shares." href="/academy/eps" />{' '}
                      {typeof rec.eps === 'number' && isFinite(rec.eps) ? rec.eps.toFixed(2) : '—'}
                    </span>
                    <span className="ml-3">
                      <InlineDef label="DY" term="Dividend Yield" definition="Annual dividends as a percentage of the share price." href="/academy/dividend-yield" />{' '}
                      {typeof rec.dy === 'number' && isFinite(rec.dy) ? `${rec.dy.toFixed(2)}%` : '—'}
                    </span>
                  </div>
                  <div className="mt-3">
                    <a className="text-sm underline" href={`/symbol/${encodeURIComponent(rec.symbol)}`}>Open</a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
    </Suspense>
  );
}
