import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const YAHOO_QUOTE = "https://query1.finance.yahoo.com/v7/finance/quote";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsStr = searchParams.get("symbols");
    if (!symbolsStr) return NextResponse.json({ items: [] });

    const symbols = symbolsStr.split(",").map((s) => s.trim()).filter(Boolean);
    const chunks: string[][] = [];
    const size = 5; // smaller batches to reduce throttling
    for (let i = 0; i < symbols.length; i += size) chunks.push(symbols.slice(i, i + size));

    const allItems: any[] = [];
    const errors: string[] = [];
    for (let bi = 0; bi < chunks.length; bi++) {
      const batch = chunks[bi];
      try {
        if (bi > 0) {
          // small delay between batches to reduce throttling
          await new Promise((r) => setTimeout(r, 250));
        }
        const url = `${YAHOO_QUOTE}?symbols=${encodeURIComponent(batch.join(","))}&region=US&lang=en-US`;
        // simple retry loop
        let res: Response | null = null;
        let lastErr: any = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            res = await fetch(url, {
              headers: { "User-Agent": "justbuyyourstockbro", "Accept": "application/json" },
              cache: "no-store",
            });
            if (res.ok) break;
            lastErr = new Error(`Yahoo quote failed: ${res.status}`);
          } catch (e) {
            lastErr = e;
          }
          await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
        }
        if (!res || !res.ok) throw lastErr || new Error("Yahoo quote failed");
        const data = await res.json();
        let items = (data?.quoteResponse?.result || []).map((q: any) => {
          const priceRaw = q.postMarketPrice ?? q.preMarketPrice ?? q.regularMarketPrice;
          const changeRaw = q.postMarketChange ?? q.preMarketChange ?? q.regularMarketChange;
          const changePctRaw = q.postMarketChangePercent ?? q.preMarketChangePercent ?? q.regularMarketChangePercent;
          let price = Number(priceRaw);
          let change = Number(changeRaw);
          let changePercent = Number(changePctRaw);
          const prevClose = Number(q.regularMarketPreviousClose);
          if (!isFinite(price) && isFinite(prevClose)) {
            price = prevClose;
          }
          if (!isFinite(change) && isFinite(price) && isFinite(prevClose) && prevClose !== 0) {
            change = price - prevClose;
          }
          if (!isFinite(changePercent) && isFinite(change) && isFinite(prevClose) && prevClose !== 0) {
            changePercent = (change / prevClose) * 100;
          }
          return {
            symbol: q.symbol,
            shortName: q.shortName,
            price,
            change,
            changePercent,
            currency: q.currency,
          };
        });
        // Fallback: if this batch yielded no items, try per-symbol fetches
        if (!items.length) {
          const perItems: any[] = [];
          for (const sym of batch) {
            try {
              await new Promise((r) => setTimeout(r, 200));
              const u = `${YAHOO_QUOTE}?symbols=${encodeURIComponent(sym)}&region=US&lang=en-US`;
              let r1: Response | null = null;
              let last: any = null;
              for (let at = 0; at < 2; at++) {
                try {
                  r1 = await fetch(u, { headers: { "User-Agent": "justbuyyourstockbro", "Accept": "application/json" }, cache: "no-store" });
                  if (r1.ok) break;
                  last = new Error(`Yahoo quote failed: ${r1.status}`);
                } catch (er) {
                  last = er;
                }
                await new Promise((r) => setTimeout(r, 200 * (at + 1)));
              }
              if (!r1 || !r1.ok) continue;
              const d1 = await r1.json();
              const itms = (d1?.quoteResponse?.result || []).map((q: any) => {
                const priceRaw = q.postMarketPrice ?? q.preMarketPrice ?? q.regularMarketPrice;
                const changeRaw = q.postMarketChange ?? q.preMarketChange ?? q.regularMarketChange;
                const changePctRaw = q.postMarketChangePercent ?? q.preMarketChangePercent ?? q.regularMarketChangePercent;
                let price = Number(priceRaw);
                let change = Number(changeRaw);
                let changePercent = Number(changePctRaw);
                const prevClose = Number(q.regularMarketPreviousClose);
                if (!isFinite(price) && isFinite(prevClose)) {
                  price = prevClose;
                }
                if (!isFinite(change) && isFinite(price) && isFinite(prevClose) && prevClose !== 0) {
                  change = price - prevClose;
                }
                if (!isFinite(changePercent) && isFinite(change) && isFinite(prevClose) && prevClose !== 0) {
                  changePercent = (change / prevClose) * 100;
                }
                return {
                  symbol: q.symbol,
                  shortName: q.shortName,
                  price,
                  change,
                  changePercent,
                  currency: q.currency,
                };
              });
              perItems.push(...itms);
            } catch {}
          }
          items = perItems;
        }
        allItems.push(...items);
      } catch (err: any) {
        errors.push(err?.message || "batch failed");
      }
    }

    if (allItems.length === 0) {
      // Soft-fail: return 200 with empty items and an error message for clients to handle gracefully
      return NextResponse.json({ items: [], error: errors.join("; ") || "failed" });
    }
    return NextResponse.json({ items: allItems });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
