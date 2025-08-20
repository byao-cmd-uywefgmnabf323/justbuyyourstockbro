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
- Use realistic, widely-followed tickers. If unsure of exact price, use plausible round numbers.
- For each stock, fill as many stats as possible. If not available, set to null or plausible value.
- Reasoning should be richer: include context, fit for user, and any notable risks.
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
        { symbol: "AAPL", name: "Apple", price: 185, change1D: "+0.5%", change1W: "+1.3%", change1M: "+4.2%", rating: 5, pe: 29, eps: 6.2, dy: 0.6, marketCap: "$2.9T", sector: "Technology", beta: 1.2, high52w: 199, low52w: 150, reasoning: "Apple is a blue-chip tech leader with stable growth, strong ecosystem, and steady cash flows. Its large market cap and global reach make it a core holding for most investors. Risks include supply chain and regulatory pressures.", fit_reason: "Matches your preference for stability and growth.", signal: "Buy", type: "equity" },
        { symbol: "MSFT", name: "Microsoft", price: 410, change1D: "+0.3%", change1W: "+2.1%", change1M: "+6.0%", rating: 5, pe: 32, eps: 9.8, dy: 0.8, marketCap: "$3.1T", sector: "Technology", beta: 0.9, high52w: 425, low52w: 320, reasoning: "Microsoft dominates cloud and enterprise software, with a fortress balance sheet. Its recurring revenues and innovation drive long-term compounding. Risks are minimal but include tech competition.", fit_reason: "Fits your long-term compounding goals.", signal: "Buy", type: "equity" },
        { symbol: "NVDA", name: "NVIDIA", price: 900, change1D: "+1.0%", change1W: "+3.5%", change1M: "+12.0%", rating: 4.5, pe: 40, eps: 8.0, dy: 0.1, marketCap: "$2.2T", sector: "Technology", beta: 1.7, high52w: 950, low52w: 400, reasoning: "NVIDIA leads in AI and graphics chips, riding secular growth in data centers and gaming. High volatility and valuation are risks, but upside is strong if trends continue.", fit_reason: "Good for growth-oriented investors seeking innovation.", signal: "Buy", type: "equity" },
        { symbol: "JNJ", name: "Johnson & Johnson", price: 160, change1D: "-0.2%", change1W: "+0.8%", change1M: "+2.0%", rating: 4, pe: 18, eps: 7.2, dy: 2.8, marketCap: "$380B", sector: "Healthcare", beta: 0.6, high52w: 180, low52w: 150, reasoning: "JNJ is a defensive healthcare giant with a long dividend history and diversified product lines. It offers stability in volatile markets, but faces drug pipeline and litigation risks.", fit_reason: "Matches your desire for steady income and low volatility.", signal: "Hold", type: "equity" },
        { symbol: "V", name: "Visa", price: 245, change1D: "+0.4%", change1W: "+1.0%", change1M: "+3.1%", rating: 4, pe: 31, eps: 8.1, dy: 0.7, marketCap: "$570B", sector: "Financials", beta: 0.95, high52w: 260, low52w: 210, reasoning: "Visa is the leading payment network, benefiting from global cashless trends. Predictable growth and high margins make it a reliable pick, though regulatory risks exist.", fit_reason: "Fits your interest in global trends and financials.", signal: "Buy", type: "equity" },
        { symbol: "BTC-USD", name: "Bitcoin", price: 65000, change1D: "+2.0%", change1W: "+5.0%", change1M: "+18.0%", rating: 3.5, pe: null, eps: null, dy: null, marketCap: "$1.2T", sector: "Crypto", beta: 2.1, high52w: 73000, low52w: 25000, reasoning: "Bitcoin is a high-risk, high-reward asset for diversification. It offers inflation hedge appeal, but is volatile and speculative.", fit_reason: "Adds diversification and risk to your portfolio.", signal: "Hold", type: "crypto" },
        { symbol: "ETH-USD", name: "Ethereum", price: 3400, change1D: "+1.2%", change1W: "+3.8%", change1M: "+12.5%", rating: 3.5, pe: null, eps: null, dy: null, marketCap: "$400B", sector: "Crypto", beta: 2.0, high52w: 4000, low52w: 1400, reasoning: "Ethereum powers smart contracts and DeFi. It is more versatile than Bitcoin, but still volatile. Regulatory and technical risks apply.", fit_reason: "For tech-forward investors seeking crypto exposure.", signal: "Hold", type: "crypto" }
      ];
      return NextResponse.json({ suggestions: fallback.slice(0, 7) });
    }
    return NextResponse.json({ suggestions });
  } catch (e: any) {
    return NextResponse.json({ error: "Unexpected error", detail: String(e?.message || e) }, { status: 500 });
  }
}
