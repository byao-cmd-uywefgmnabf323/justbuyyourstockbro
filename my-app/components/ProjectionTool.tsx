"use client";

import React, { useEffect, useMemo, useState } from "react";

type Props = {
  symbol: string;
  currentPrice?: number | null;
};

function fmtUSD(n: number | null | undefined) {
  if (!Number.isFinite(n as number)) return "—";
  return n!.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

export default function ProjectionTool({ symbol, currentPrice }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cagr, setCagr] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(1000);

  // Annualized return sliders (as percentages, e.g., 8 means 8%)
  const [avg, setAvg] = useState<number>(8);
  const [pess, setPess] = useState<number>(2);
  const [opt, setOpt] = useState<number>(15);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true); setErr(null);
        // Get up to 10 years of data; weekly to keep payload small
        const r = await fetch(`/api/market/history?symbol=${encodeURIComponent(symbol)}&range=10y&interval=1wk`, { cache: "no-store" });
        const j = await r.json();
        const candles: Array<{ t: number; c: number }> = Array.isArray(j.candles) ? j.candles : [];
        if (!candles.length) throw new Error("no data");
        const first = candles.find(d => Number.isFinite(d.c))?.c;
        const last = [...candles].reverse().find(d => Number.isFinite(d.c))?.c;
        if (!first || !last) throw new Error("bad data");
        const years = Math.max(1, (candles[candles.length - 1].t - candles[0].t) / (365 * 24 * 3600 * 1000));
        const computed = Math.pow(last / first, 1 / years) - 1;
        if (!mounted) return;
        setCagr(computed);
        // Seed sliders around CAGR
        const basePct = clamp(Math.round(computed * 100), -30, 30);
        setAvg(basePct);
        setPess(clamp(basePct - 6, -30, 30));
        setOpt(clamp(basePct + 8, -30, 30));
      } catch (e:any) {
        if (!mounted) return;
        setErr(e?.message || "failed");
        // keep default slider values
      } finally {
        mounted = false; setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [symbol]);

  const proj = useMemo(() => {
    const calc = (ratePct: number, years: number) => {
      const r = ratePct / 100;
      return amount * Math.pow(1 + r, years);
    };
    return {
      avg: { y1: calc(avg, 1), y5: calc(avg, 5), y10: calc(avg, 10) },
      pess: { y1: calc(pess, 1), y5: calc(pess, 5), y10: calc(pess, 10) },
      opt: { y1: calc(opt, 1), y5: calc(opt, 5), y10: calc(opt, 10) },
    };
  }, [amount, avg, pess, opt]);

  return (
    <div className="mt-3 border border-gray-200 rounded-md p-3 bg-white">
      <div className="text-xs text-black mb-2">
        <b>Hypothetical Investment Projection</b>
        <div className="mt-1 text-[11px] leading-snug text-gray-700">
          This tool uses historical price data to seed annual return assumptions. These are <b>not predictions</b>.
          Past performance does <b>not</b> guarantee future results.
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <label className="text-xs text-black w-40">Investment amount</label>
        <input
          type="number"
          min={0}
          step={100}
          value={amount}
          onChange={(e)=> setAmount(clamp(parseFloat(e.target.value || "0"), 0, 10_000_000))}
          className="w-full sm:w-60 border border-gray-300 bg-white px-2 py-1 text-sm text-charcoal"
        />
        <div className="text-xs text-black">at current price {fmtUSD(currentPrice || null)}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
        <div>
          <div className="text-xs font-semibold text-black">Pessimistic: {pess}%</div>
          <input type="range" min={-30} max={30} value={pess} onChange={(e)=> setPess(parseInt(e.target.value, 10))} className="w-full" />
          <div className="mt-1 text-xs text-gray-800">
            1y {fmtUSD(proj.pess.y1)} · 5y {fmtUSD(proj.pess.y5)} · 10y {fmtUSD(proj.pess.y10)}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-black">Average: {avg}% {cagr!=null && (
            <span className="ml-1 text-[11px] text-gray-600">(hist ~{Math.round(cagr*100)}%)</span>
          )}</div>
          <input type="range" min={-30} max={30} value={avg} onChange={(e)=> setAvg(parseInt(e.target.value, 10))} className="w-full" />
          <div className="mt-1 text-xs text-gray-800">
            1y {fmtUSD(proj.avg.y1)} · 5y {fmtUSD(proj.avg.y5)} · 10y {fmtUSD(proj.avg.y10)}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-black">Optimistic: {opt}%</div>
          <input type="range" min={-30} max={30} value={opt} onChange={(e)=> setOpt(parseInt(e.target.value, 10))} className="w-full" />
          <div className="mt-1 text-xs text-gray-800">
            1y {fmtUSD(proj.opt.y1)} · 5y {fmtUSD(proj.opt.y5)} · 10y {fmtUSD(proj.opt.y10)}
          </div>
        </div>
      </div>

      {loading && <div className="mt-2 text-[11px] text-gray-600">Loading historical data…</div>}
      {err && <div className="mt-2 text-[11px] text-red-700">Could not load history for {symbol}. Using default sliders.</div>}
    </div>
  );
}
