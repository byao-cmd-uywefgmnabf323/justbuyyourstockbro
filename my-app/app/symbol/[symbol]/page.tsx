"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PriceChart from "@/components/PriceChart";

type Quote = {
  symbol: string;
  shortName?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  currency?: string;
};

function fmt(v?: number | null, digits = 2) {
  return typeof v === "number" && isFinite(v) ? v.toFixed(digits) : "—";
}

export default function SymbolDetailPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = decodeURIComponent(params.symbol);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [range, setRange] = useState<"1mo" | "3mo" | "6mo" | "1y" | "ytd" | "max">("6mo");
  const [interval, setInterval] = useState<"1d" | "1h" | "1wk">("1d");
  const [candles, setCandles] = useState<Array<{ t: number; c: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBullets, setAiBullets] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  // Smart Report state
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [report, setReport] = useState<string>("");
  const printRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadQuote = async () => {
      try {
        const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(symbol)}`, { cache: "no-store" });
        const j = await res.json();
        if (Array.isArray(j.items) && j.items.length > 0) setQuote(j.items[0]);
      } catch {}
    };
    loadQuote();
  }, [symbol]);

  useEffect(() => {
    let mounted = true;
    const loadHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/market/history?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`, { cache: "no-store" });
        const j = await res.json();
        if (mounted) setCandles(j.candles || []);
      } catch {
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadHistory();
    return () => { mounted = false; };
  }, [symbol, range, interval]);

  // Load AI reasons for symbol
  useEffect(() => {
    let mounted = true;
    const loadReasons = async () => {
      try {
        setAiLoading(true);
        setAiError(null);
        const res = await fetch('/api/ai/reason', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol }),
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'AI reason failed');
        }
        const j = await res.json();
        if (mounted) setAiBullets(Array.isArray(j.bullets) ? j.bullets.slice(0, 8) : []);
      } catch (e: any) {
        if (mounted) setAiError('Unable to load AI reasons');
      } finally {
        if (mounted) setAiLoading(false);
      }
    };
    loadReasons();
    return () => { mounted = false; };
  }, [symbol]);

  // Indicator helpers
  const closes = useMemo(() => candles.map(c => c.c), [candles]);
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
      if (i === 0) prev = v; else if (prev != null) prev = v * k + prev * (1 - k);
      out.push(i >= period - 1 ? prev : null);
    }
    return out;
  };
  const macd = useMemo(() => {
    const ema12 = ema(closes, 12);
    const ema26 = ema(closes, 26);
    const macdLine = closes.map((_, i) => (ema12[i] != null && ema26[i] != null ? (ema12[i]! - ema26[i]!) : null));
    const signal = ema(macdLine.map(v => v ?? 0), 9);
    const hist = macdLine.map((v, i) => (v != null && signal[i] != null ? v - signal[i]! : null));
    return { macdLine, signal, hist };
  }, [closes]);
  const rsiArr = useMemo(() => {
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
      } else out.push(null);
    }
    return [null, ...out];
  }, [closes]);

  const latestIdx = closes.length - 1;
  const stats = useMemo(() => {
    if (closes.length === 0) {
      return { price: undefined, min52w: undefined, max52w: undefined, s20: undefined, s50: undefined, s200: undefined, e12: undefined, e26: undefined, rsi: undefined, macd: undefined, macdSignal: undefined, macdHist: undefined } as Record<string, number | undefined> as any;
    }
    const price = closes[latestIdx];
    const last252 = closes.slice(-252);
    const min = last252.length ? Math.min(...last252) : undefined;
    const max = last252.length ? Math.max(...last252) : undefined;
    const s20 = sma(closes, 20)[latestIdx] ?? undefined;
    const s50 = sma(closes, 50)[latestIdx] ?? undefined;
    const s200 = sma(closes, 200)[latestIdx] ?? undefined;
    const e12 = ema(closes, 12)[latestIdx] ?? undefined;
    const e26 = ema(closes, 26)[latestIdx] ?? undefined;
    const rsi = rsiArr[latestIdx] ?? undefined;
    const m = macd.macdLine[latestIdx] ?? undefined;
    const sig = macd.signal[latestIdx] ?? undefined;
    const hist = macd.hist[latestIdx] ?? undefined;
    return { price, min52w: min, max52w: max, s20, s50, s200, e12, e26, rsi, macd: m, macdSignal: sig, macdHist: hist };
  }, [closes, latestIdx, macd, rsiArr]);

  // Build a default local report in case AI endpoint is unavailable
  const buildLocalReport = (): string => {
    const lines: string[] = [];
    lines.push(`# ${quote?.shortName || symbol} — Smart Report`);
    lines.push("");
    lines.push(`Symbol: ${symbol}`);
    lines.push(`Currency: ${quote?.currency || "USD"}`);
    lines.push("");
    lines.push(`Price: $${fmt(stats.price)}`);
    lines.push(`Change: ${fmt(quote?.change)} (${fmt(quote?.changePercent)}%)`);
    lines.push(`52W Range: $${fmt(stats.min52w)} – $${fmt(stats.max52w)}`);
    lines.push(`SMA20/50/200: ${fmt(stats.s20)} / ${fmt(stats.s50)} / ${fmt(stats.s200)}`);
    lines.push(`EMA12/26: ${fmt(stats.e12)} / ${fmt(stats.e26)}`);
    lines.push(`RSI(14): ${fmt(stats.rsi)}`);
    lines.push(`MACD / Signal / Hist: ${fmt(stats.macd)} / ${fmt(stats.macdSignal)} / ${fmt(stats.macdHist)}`);
    lines.push("");
    if (aiBullets.length) {
      lines.push(`AI Highlights:`);
      for (const b of aiBullets) lines.push(`- ${b}`);
      lines.push("");
    }
    lines.push(`Summary Recommendation:`);
    lines.push(`- Suitability depends on your risk, horizon, and sector preference.`);
    lines.push(`- Consider trend vs. mean-reversion signals from MAs, RSI, and MACD.`);
    lines.push(`- Always cross-check fundamentals and news catalysts.`);
    return lines.join("\n");
  };

  const generateReport = async () => {
    try {
      setReportLoading(true);
      setReportError(null);
      // Try backend AI endpoint first (optional)
      const payload = {
        symbol,
        context: { stats, aiBullets },
      };
      let text = "";
      try {
        const res = await fetch('/api/ai/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const j = await res.json();
          text = typeof j?.report === 'string' ? j.report : '';
        }
      } catch {
        // ignore network errors; fallback below
      }
      if (!text) text = buildLocalReport();
      setReport(text);
      // Focus printable area
      setTimeout(() => printRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e: any) {
      setReportError(e?.message || 'Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  const printReport = () => {
    // Use a simple print flow; users can save as PDF
    window.print();
  };

  const openInGoogleDocs = async () => {
    try {
      if (report) {
        await navigator.clipboard.writeText(report);
      } else {
        await navigator.clipboard.writeText(buildLocalReport());
      }
    } catch {}
    window.open('https://docs.new', '_blank');
  };

  return (
    <main className="min-h-screen py-8 bg-background">
      <div className="w-full max-w-laptop mx-auto px-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-charcoal">{quote?.shortName || symbol}</h1>
            <div className="text-sm text-black">{symbol} · {quote?.currency || "USD"}</div>
          </div>
          <div className="flex gap-2">
            {(["1mo","3mo","6mo","1y","ytd","max"] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 border ${range===r?"bg-gray-200":"bg-white"} text-black`}>{r}</button>
            ))}
            {(["1d","1h","1wk"] as const).map((iv) => (
              <button key={iv} onClick={() => setInterval(iv)} className={`px-3 py-1 border ${interval===iv?"bg-gray-200":"bg-white"} text-black`}>{iv}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <section className="lg:col-span-2">
            <PriceChart symbol={symbol} range={range} interval={interval} height={320} showMA showEMA showMACD showRSI />
          </section>
          <aside className="bg-white border border-gray-300 p-4">
            <h2 className="font-semibold text-charcoal mb-2">Key Stats</h2>
            <ul className="text-sm text-black space-y-1">
              <li><span className="font-semibold">Price:</span> ${fmt(stats.price)}</li>
              <li><span className="font-semibold">Change:</span> {fmt(quote?.change)} ({fmt(quote?.changePercent)}%)</li>
              <li><span className="font-semibold">52W Low/High:</span> ${fmt(stats.min52w)} / ${fmt(stats.max52w)}</li>
              <li><span className="font-semibold">SMA20 / SMA50 / SMA200:</span> {fmt(stats.s20)} / {fmt(stats.s50)} / {fmt(stats.s200)}</li>
              <li><span className="font-semibold">EMA12 / EMA26:</span> {fmt(stats.e12)} / {fmt(stats.e26)}</li>
              <li><span className="font-semibold">RSI(14):</span> {fmt(stats.rsi)}</li>
              <li><span className="font-semibold">MACD / Signal / Hist:</span> {fmt(stats.macd)} / {fmt(stats.macdSignal)} / {fmt(stats.macdHist)}</li>
            </ul>
            <div className="mt-4">
              <h3 className="font-semibold text-charcoal mb-1">AI Reasons</h3>
              {aiLoading && <div className="text-sm text-black">Generating…</div>}
              {aiError && <div className="text-sm text-red-600">{aiError}</div>}
              {!aiLoading && !aiError && aiBullets.length > 0 && (
                <ul className="list-disc pl-5 text-sm text-black space-y-1">
                  {aiBullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
            {/* Smart Report */}
            <div className="mt-6">
              <h3 className="font-semibold text-charcoal mb-2">Smart Report</h3>
              <div className="flex gap-2">
                <button onClick={generateReport} disabled={reportLoading} className="px-3 py-1.5 border border-gray-900 bg-black text-white text-sm rounded-none">
                  {reportLoading ? 'Generating…' : 'Generate Report'}
                </button>
                <button onClick={printReport} disabled={!report} className="px-3 py-1.5 border border-gray-900 bg-white text-black text-sm rounded-none disabled:opacity-60">
                  Download PDF
                </button>
                <button onClick={openInGoogleDocs} className="px-3 py-1.5 border border-gray-900 bg-white text-black text-sm rounded-none">
                  Open in Google Docs
                </button>
              </div>
              {reportError && <div className="mt-2 text-sm text-red-600">{reportError}</div>}
              {report && (
                <div ref={printRef} className="mt-3 whitespace-pre-wrap text-sm text-black bg-white border border-gray-300 p-3">
                  {report}
                </div>
              )}
            </div>
            <div className="mt-4">
              <Link href="/" className="text-sm underline">Back to Home</Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
