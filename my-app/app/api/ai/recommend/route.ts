import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a seasoned investment assistant. Given a user's profile, propose diversified, personalized investment ideas.
Return STRICT JSON with this shape:
{
  "suggestions": [
    {
      "type": "equity" | "crypto" | "forex",
      "symbol": string,
      "name": string,
      "price": number,
      "change1D": string,
      "change1W": string,
      "change1M": string,
      "rating": number,
      "pe": number | null,
      "eps": number | null,
      "dy": number | null,
      "reasoning": string,
      "signal": "Buy" | "Hold" | "Sell"
    }
  ]
}
- Use realistic, widely-followed tickers. If unsure of exact price, use plausible round numbers.
- Keep strings short and factual, no filler.
- Do not include any extra keys or commentary.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Server missing MISTRAL_API_KEY" }, { status: 500 });

    const userProfile = JSON.stringify(body);
    const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `User profile: ${userProfile}` },
        ],
        temperature: 0.4,
        max_tokens: 700,
      }),
    });

    const text = await resp.text();
    if (!resp.ok) return NextResponse.json({ error: "Mistral error", detail: text }, { status: 500 });

    // Try to parse JSON strictly; if content is wrapped, extract JSON blob
    let content = "";
    try {
      const data = JSON.parse(text);
      content = data?.choices?.[0]?.message?.content ?? "";
    } catch {
      content = text;
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch {}
      }
    }

    if (!parsed || !Array.isArray(parsed.suggestions)) {
      return NextResponse.json({ suggestions: [] });
    }

    // Basic sanitization/coercion
    const suggestions = parsed.suggestions.slice(0, 20).map((s: any) => ({
      type: s.type === 'crypto' ? 'crypto' : s.type === 'forex' ? 'forex' : 'equity',
      symbol: String(s.symbol || '').toUpperCase().slice(0, 12),
      name: String(s.name || '').slice(0, 80),
      price: Number.isFinite(Number(s.price)) ? Number(s.price) : 0,
      change1D: String(s.change1D || '0%'),
      change1W: String(s.change1W || '0%'),
      change1M: String(s.change1M || '0%'),
      rating: Math.max(0, Math.min(5, Number(s.rating) || 0)),
      pe: s.pe == null ? null : Number(s.pe),
      eps: s.eps == null ? null : Number(s.eps),
      dy: s.dy == null ? null : Number(s.dy),
      reasoning: String(s.reasoning || '').slice(0, 300),
      signal: ['Buy','Hold','Sell'].includes(s.signal) ? s.signal : 'Hold',
    }));

    // Fallback: ensure at least 5-7 suggestions
    if (!Array.isArray(suggestions) || suggestions.length < 5) {
      const fallback = [
        { symbol: "AAPL", name: "Apple", price: 185, change1D: "+0.5%", change1W: "+1.3%", change1M: "+4.2%", rating: 5, pe: 29, eps: 6.2, dy: 0.6, reasoning: "Blue-chip tech, stable growth.", signal: "Buy", type: "equity" },
        { symbol: "MSFT", name: "Microsoft", price: 410, change1D: "+0.3%", change1W: "+2.1%", change1M: "+6.0%", rating: 5, pe: 32, eps: 9.8, dy: 0.8, reasoning: "Cloud leadership, strong balance sheet.", signal: "Buy", type: "equity" },
        { symbol: "NVDA", name: "NVIDIA", price: 900, change1D: "+1.0%", change1W: "+3.5%", change1M: "+12.0%", rating: 4.5, pe: 40, eps: 8.0, dy: 0.1, reasoning: "AI growth, high momentum.", signal: "Buy", type: "equity" },
        { symbol: "JNJ", name: "Johnson & Johnson", price: 160, change1D: "-0.2%", change1W: "+0.8%", change1M: "+2.0%", rating: 4, pe: 18, eps: 7.2, dy: 2.8, reasoning: "Defensive healthcare, steady dividend.", signal: "Hold", type: "equity" },
        { symbol: "V", name: "Visa", price: 245, change1D: "+0.4%", change1W: "+1.0%", change1M: "+3.1%", rating: 4, pe: 31, eps: 8.1, dy: 0.7, reasoning: "Payment network, global scale.", signal: "Buy", type: "equity" },
        { symbol: "BTC-USD", name: "Bitcoin", price: 65000, change1D: "+2.0%", change1W: "+5.0%", change1M: "+18.0%", rating: 3.5, pe: null, eps: null, dy: null, reasoning: "Crypto diversification, high risk.", signal: "Hold", type: "crypto" },
        { symbol: "ETH-USD", name: "Ethereum", price: 3400, change1D: "+1.2%", change1W: "+3.8%", change1M: "+12.5%", rating: 3.5, pe: null, eps: null, dy: null, reasoning: "Smart contracts, crypto exposure.", signal: "Hold", type: "crypto" }
      ];
      return NextResponse.json({ suggestions: fallback.slice(0, 7) });
    }
    return NextResponse.json({ suggestions });
  } catch (e: any) {
    return NextResponse.json({ error: "Unexpected error", detail: String(e?.message || e) }, { status: 500 });
  }
}
