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

    return NextResponse.json({ suggestions });
  } catch (e: any) {
    return NextResponse.json({ error: "Unexpected error", detail: String(e?.message || e) }, { status: 500 });
  }
}
