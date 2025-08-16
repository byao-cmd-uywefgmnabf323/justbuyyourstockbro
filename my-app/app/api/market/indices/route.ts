import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const YAHOO_QUOTE_PRIMARY = "https://query1.finance.yahoo.com/v7/finance/quote";
const YAHOO_QUOTE_FALLBACK = "https://query2.finance.yahoo.com/v7/finance/quote";

export async function GET() {
  const symbols = encodeURIComponent("^GSPC,^IXIC,^DJI");
  const headers = { "User-Agent": "justbuyyourstockbro" } as const;

  const fetchQuote = async (base: string) => {
    const res = await fetch(`${base}?symbols=${symbols}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Yahoo quote failed: ${res.status}`);
    const data = await res.json();
    return (data?.quoteResponse?.result || []).map((q: any) => ({
      symbol: q.symbol,
      shortName: q.shortName,
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePercent: q.regularMarketChangePercent,
    }));
  };

  try {
    const items = await fetchQuote(YAHOO_QUOTE_PRIMARY);
    return NextResponse.json({ indices: items, source: "yahoo-primary" });
  } catch (e1: any) {
    try {
      const items = await fetchQuote(YAHOO_QUOTE_FALLBACK);
      return NextResponse.json({ indices: items, source: "yahoo-fallback" });
    } catch (e2: any) {
      // Graceful fallback to mock values so the UI still shows something
      const now = Date.now();
      const mock = [
        { symbol: "^GSPC", shortName: "S&P 500", price: 5000, change: 0, changePercent: 0 },
        { symbol: "^IXIC", shortName: "Nasdaq", price: 16000, change: 0, changePercent: 0 },
        { symbol: "^DJI", shortName: "Dow", price: 38000, change: 0, changePercent: 0 },
      ];
      return NextResponse.json({ indices: mock, source: "mock", error: e2?.message || e1?.message, ts: now });
    }
  }
}
