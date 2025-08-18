import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a quantitative assistant. Given a symbol, date range, and a natural-language strategy description, simulate a simple backtest at a high level using plausible assumptions. Return STRICT JSON with this shape:
{
  "summary": string, // 1-2 sentence overview
  "metrics": {
    "cagr": string, // e.g., "12.4%"
    "volatility": string, // e.g., "18.2%"
    "sharpe": string, // e.g., "0.68"
    "maxDrawdown": string // e.g., "-22.5%"
  },
  "bullets": string[] // 5 concise takeaways
}
- Keep values reasonable. If inputs are ambiguous, assume typical liquid US equity behavior.
- No commentary outside of the JSON.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { symbol, start, end, strategy } = body || {};
    if (!symbol || !strategy) {
      return NextResponse.json({ error: "Missing symbol or strategy" }, { status: 400 });
    }
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Server missing MISTRAL_API_KEY" }, { status: 500 });

    const userMsg = JSON.stringify({ symbol, start, end, strategy });

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
          { role: "user", content: userMsg },
        ],
        temperature: 0.3,
        max_tokens: 600,
      }),
    });

    const text = await resp.text();
    if (!resp.ok) return NextResponse.json({ error: "Mistral error", detail: text }, { status: 500 });

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
      if (match) { try { parsed = JSON.parse(match[0]); } catch {} }
    }

    if (!parsed) return NextResponse.json({ error: "Parse error" }, { status: 500 });

    return NextResponse.json({
      summary: String(parsed.summary || ""),
      metrics: parsed.metrics || { cagr: "—", volatility: "—", sharpe: "—", maxDrawdown: "—" },
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 8) : [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Unexpected error", detail: String(e?.message || e) }, { status: 500 });
  }
}
