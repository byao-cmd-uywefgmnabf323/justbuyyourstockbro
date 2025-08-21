"use client";
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart,
  Bar,
  ReferenceLine,
} from "recharts";

interface PriceChartProps {
  symbol: string;
  range?: string; // e.g., 1mo, 3mo, 6mo, 1y, 5y, ytd, max
  interval?: string; // e.g., 1d, 1h, 1m
  height?: number;
  showMA?: boolean;
  showEMA?: boolean;
  showMACD?: boolean;
  showRSI?: boolean;
}

interface CandlePoint {
  t: number; // ms
  c: number; // close
}

export default function PriceChart({ symbol, range = "6mo", interval = "1d", height = 220, showMA = true, showEMA = true, showMACD = true, showRSI = true }: PriceChartProps) {
  const [data, setData] = useState<CandlePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/market/history?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`);
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        if (mounted) setData(Array.isArray(json.items) ? json.items : (json.candles || []));
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load chart");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [symbol, range, interval]);

  if (loading) {
    return <div className="text-center text-sm text-gray-600">Loading chart…</div>;
  }
  if (error) {
    return <div className="text-center text-sm text-red-600">{error}</div>;
  }
  if (!data?.length) {
    return <div className="text-center text-sm text-gray-600">No chart data</div>;
  }

  // Map to recharts friendly { time, close }
  const base = data.map((d) => ({ time: new Date(d.t).toLocaleDateString(), close: d.c }));

  // Helpers
  const sma = (vals: number[], period: number) => {
    const out: (number | null)[] = [];
    let sum = 0;
    for (let i = 0; i < vals.length; i++) {
      sum += vals[i];
      if (i >= period) sum -= vals[i - period];
      out.push(i >= period - 1 ? sum / period : null);
    }
    return out;
  };
  const ema = (vals: number[], period: number) => {
    const out: (number | null)[] = [];
    const k = 2 / (period + 1);
    let prev: number | null = null;
    for (let i = 0; i < vals.length; i++) {
      const v = vals[i];
      if (i === 0) {
        prev = v;
      } else if (prev != null) {
        prev = v * k + prev * (1 - k);
      }
      out.push(i >= period - 1 ? prev : null);
    }
    return out;
  };
  // MACD (12,26,9)
  const closes = data.map((d) => d.c);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = closes.map((_, i) => (ema12[i] != null && ema26[i] != null ? (ema12[i]! - ema26[i]!) : null));
  const macdSignal = ema(macdLine.map((v) => (v ?? 0)), 9);
  const macdHist = macdLine.map((v, i) => (v != null && macdSignal[i] != null ? v - macdSignal[i]! : null));
  // RSI(14)
  const rsi = (() => {
    const period = 14;
    const out: (number | null)[] = [];
    let gains = 0, losses = 0;
    for (let i = 1; i < closes.length; i++) {
      const ch = closes[i] - closes[i - 1];
      gains += Math.max(0, ch);
      losses += Math.max(0, -ch);
      if (i >= period) {
        const chOld = closes[i - period + 1] - closes[i - period];
        gains -= Math.max(0, chOld);
        losses -= Math.max(0, -chOld);
      }
      if (i >= period) {
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsiVal = 100 - 100 / (1 + rs);
        out.push(rsiVal);
      } else {
        out.push(null);
      }
    }
    return [null, ...out];
  })();

  const series = base.map((row, i) => ({
    ...row,
    sma20: sma(closes, 20)[i],
    sma50: sma(closes, 50)[i],
    sma200: sma(closes, 200)[i],
    ema12: ema12[i],
    ema26: ema26[i],
    macd: macdLine[i],
    macdSignal: macdSignal[i],
    macdHist: macdHist[i],
    rsi: rsi[i],
  }));

  return (
    <div className="w-full border border-gray-300 bg-white">
      {/* Price + MAs/EMAs */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#111827" }} hide={series.length > 120} />
          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#111827" }} />
          <Tooltip contentStyle={{ borderRadius: 0 }} />
          <Line type="monotone" dataKey="close" stroke="#111827" strokeWidth={2} dot={false} />
          {showMA && (
            <>
              <Line type="monotone" dataKey="sma20" stroke="#1f77b4" strokeWidth={1} dot={false} connectNulls />
              <Line type="monotone" dataKey="sma50" stroke="#ff7f0e" strokeWidth={1} dot={false} connectNulls />
              <Line type="monotone" dataKey="sma200" stroke="#2ca02c" strokeWidth={1} dot={false} connectNulls />
            </>
          )}
          {showEMA && (
            <>
              <Line type="monotone" dataKey="ema12" stroke="#8c564b" strokeWidth={1} dot={false} connectNulls />
              <Line type="monotone" dataKey="ema26" stroke="#9467bd" strokeWidth={1} dot={false} connectNulls />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* MACD */}
      {showMACD && (
        <div className="border-t border-gray-200">
          <ResponsiveContainer width="100%" height={120}>
            <ComposedChart data={series} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
              <XAxis dataKey="time" hide />
              <YAxis tick={{ fontSize: 10, fill: "#111827" }} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ borderRadius: 0 }} />
              <Bar dataKey="macdHist" barSize={2} fill="#9ca3af" />
              <Line type="monotone" dataKey="macd" stroke="#111827" strokeWidth={1} dot={false} connectNulls />
              <Line type="monotone" dataKey="macdSignal" stroke="#ef4444" strokeWidth={1} dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* RSI */}
      {showRSI && (
        <div className="border-t border-gray-200">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={series} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#111827" }} />
              <Tooltip contentStyle={{ borderRadius: 0 }} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 2" />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="4 2" />
              <Line type="monotone" dataKey="rsi" stroke="#2563eb" strokeWidth={1} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
