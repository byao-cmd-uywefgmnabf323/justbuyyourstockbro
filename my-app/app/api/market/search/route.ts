import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const YAHOO_SEARCH = "https://query1.finance.yahoo.com/v1/finance/search";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    if (!q) return NextResponse.json({ items: [] });

    const url = `${YAHOO_SEARCH}?q=${encodeURIComponent(q)}&quotesCount=5&newsCount=0&listsCount=0`;
    const res = await fetch(url, {
      headers: { "User-Agent": "justbuyyourstockbro" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Yahoo search failed: ${res.status}`);
    const data = await res.json();
    const items = (data?.quotes || []).map((q: any) => ({
      symbol: q.symbol,
      shortname: q.shortname || q.longname || q.symbol,
      exch: q.exchange || q.exchDisp,
      type: q.quoteType,
    }));
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
