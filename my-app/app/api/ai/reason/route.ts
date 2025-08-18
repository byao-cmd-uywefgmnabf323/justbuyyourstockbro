import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { symbol, context } = await req.json();
    if (!symbol) {
      return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
    }
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server missing MISTRAL_API_KEY" }, { status: 500 });
    }

    const prompt = `You are an equity analyst. Provide 5 concise bullet points explaining why a user should consider researching ${symbol} based on typical factors like valuation, growth, profitability, dividends, and risk. Use short phrases, no filler. Output bullets only.` + (context ? `\nUser context: ${context}` : "");

    const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: "You are a concise financial assistant. Return only bullet points." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 300,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ error: "Mistral error", detail: txt }, { status: 500 });
    }

    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    // Parse bullets by lines starting with -, •, *
    const lines = content
      .split(/\r?\n/)
      .map((l: string) => l.trim())
      .filter(Boolean)
      .map((l: string) => l.replace(/^[-*•]\s?/, ""));

    const bullets = lines.length > 0 ? lines : [content];

    return NextResponse.json({ symbol, bullets });
  } catch (err: any) {
    return NextResponse.json({ error: "Unexpected error", detail: String(err?.message || err) }, { status: 500 });
  }
}
