import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a seasoned investment assistant. Analyze the user's conversation and generate PERSONALIZED stock recommendations based on their specific requests, preferences, and investment goals.

CRITICAL: Pay close attention to:
- Specific sectors mentioned (e.g., "healthcare stocks" → JNJ, PFE, UNH, ABBV)
- Investment style (growth vs value vs dividend)
- Risk tolerance
- Time horizon
- Any specific companies or themes mentioned

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
      "marketCap": string | null,
      "sector": string | null,
      "beta": number | null,
      "high52w": number | null,
      "low52w": number | null,
      "reasoning": string, // 2-3 sentences: why is this a fit for the user, what stands out, what are the risks?
      "fit_reason": string, // 1 sentence: why this matches user's profile
      "signal": "Buy" | "Hold" | "Sell"
    }
  ]
}

Examples:
- "healthcare stocks" → JNJ, PFE, UNH, ABBV, MRK
- "tech stocks" → AAPL, MSFT, GOOGL, NVDA, META
- "dividend stocks" → KO, PG, JNJ, VZ, T
- "growth stocks" → TSLA, NVDA, AMZN, GOOGL
- "value stocks" → BRK.B, JPM, XOM, CVX

Use realistic, widely-followed tickers. Generate 3-7 suggestions that directly match the user's request.`;

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

    // Return AI suggestions even if fewer than 5 - let the AI decide what's appropriate
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      // Only fallback if AI completely failed to generate any suggestions
      console.log("AI failed to generate suggestions, using fallback");
      const fallback = [
        { symbol: "AAPL", name: "Apple", price: 185, change1D: "+0.5%", change1W: "+1.3%", change1M: "+4.2%", rating: 5, pe: 29, eps: 6.2, dy: 0.6, reasoning: "Fallback recommendation - AI service unavailable", signal: "Hold", type: "equity" },
        { symbol: "MSFT", name: "Microsoft", price: 410, change1D: "+0.3%", change1W: "+2.1%", change1M: "+6.0%", rating: 5, pe: 32, eps: 9.8, dy: 0.8, reasoning: "Fallback recommendation - AI service unavailable", signal: "Hold", type: "equity" },
        { symbol: "JNJ", name: "Johnson & Johnson", price: 160, change1D: "-0.2%", change1W: "+0.8%", change1M: "+2.0%", rating: 4, pe: 18, eps: 7.2, dy: 2.8, reasoning: "Fallback recommendation - AI service unavailable", signal: "Hold", type: "equity" }
      ];
      return NextResponse.json({ suggestions: fallback });
    }
    return NextResponse.json({ suggestions });
  } catch (e: any) {
    return NextResponse.json({ error: "Unexpected error", detail: String(e?.message || e) }, { status: 500 });
  }
}
