import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");
    const range = searchParams.get("range") || "6mo";
    const interval = searchParams.get("interval") || "1d";
    if (!symbol) return NextResponse.json({ candles: [] });

    const url = `${YAHOO_CHART}/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "justbuyyourstockbro" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Yahoo chart failed: ${res.status}`);
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp || [];
    const closes: number[] = result?.indicators?.quote?.[0]?.close || [];

    const candles = timestamps.map((t, i) => ({
      t: t * 1000,
      c: closes[i],
    })).filter((d) => Number.isFinite(d.c));

    return NextResponse.json({ candles });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
