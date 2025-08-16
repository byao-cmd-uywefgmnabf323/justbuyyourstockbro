import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Simple runtime validator
function isSafeSymbol(sym: unknown): sym is string {
  return typeof sym === "string" && sym.length > 0 && sym.length <= 12 && /^[A-Za-z0-9._-]+$/.test(sym);
}
function isSafePath(p: unknown): p is string {
  return typeof p === "string" && /^\/symbol\/[A-Za-z0-9._-]+$/.test(p);
}

// Schema of advisor output
interface RecommendItem { symbol: string; reason?: string; fit_score?: number }
interface AdviceAction {
  type: "recommend_stocks" | "navigate" | "add_to_watchlist";
  data: any;
}

function normalizeActions(raw: any): AdviceAction[] {
  const out: AdviceAction[] = [];
  if (!raw || !Array.isArray(raw.actions)) return out;
  for (const a of raw.actions.slice(0, 10)) {
    if (!a || typeof a !== "object" || typeof a.type !== "string") continue;
    if (a.type === "recommend_stocks" && Array.isArray(a.data)) {
      const items: RecommendItem[] = [];
      for (const it of a.data.slice(0, 20)) {
        if (it && isSafeSymbol(it.symbol)) {
          items.push({ symbol: it.symbol, reason: typeof it.reason === "string" ? it.reason : undefined, fit_score: typeof it.fit_score === "number" ? it.fit_score : undefined });
        }
      }
      out.push({ type: "recommend_stocks", data: items });
    } else if (a.type === "navigate" && a.data && isSafePath(a.data.to)) {
      out.push({ type: "navigate", data: { to: a.data.to } });
    } else if (a.type === "add_to_watchlist" && a.data && isSafeSymbol(a.data.symbol)) {
      out.push({ type: "add_to_watchlist", data: { symbol: a.data.symbol } });
    }
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing MISTRAL_API_KEY" }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const profile = body?.profile ?? {};

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 12000);

    const system = `You are an investment suitability advisor integrated in a Next.js app.\nReturn STRICT JSON only. No prose.\nGiven a user profile (risk, horizon, sectors, preferences, constraints), you may return: \n- recommend_stocks: up to 10 items with {symbol, reason, fit_score in [0,1]}\n- navigate: { to: "/symbol/TICKER" }\n- add_to_watchlist: { symbol }\nRules:\n- Only use real ticker symbols.\n- Keep reasons short.\n- Prefer large-cap diversified picks for low risk.\n- Never include HTML or markdown.\n- Respond with {\"actions\": [...] } only.`;

    const user = { role: "user", content: JSON.stringify({ profile }) } as const;

    // Few-shot example to increase reliability of JSON actions
    const exampleUser = {
      role: "user",
      content: JSON.stringify({ profile: { risk: "low", horizon: "long", sectors: ["tech"] } })
    } as const;
    const exampleAssistant = {
      role: "assistant",
      content: JSON.stringify({
        actions: [
          {
            type: "recommend_stocks",
            data: [
              { symbol: "VOO", reason: "Broad, low-cost S&P 500 exposure for low risk.", fit_score: 0.92 },
              { symbol: "MSFT", reason: "Mega-cap, diversified revenue profile.", fit_score: 0.88 }
            ]
          },
          { type: "navigate", data: { to: "/symbol/VOO" } }
        ]
      })
    } as const;

    const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 600,
        messages: [
          { role: "system", content: system },
          exampleUser,
          exampleAssistant,
          user,
        ],
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(t);

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return NextResponse.json({ error: `Mistral error ${resp.status}`, detail: text.slice(0, 500) }, { status: 502 });
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || "{}";
    // Temporary debug log (server-side only)
    try { console.log("[advisor] provider content:", String(content).slice(0, 500)); } catch {}

    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch {}
    let actions = normalizeActions(parsed);

    // Minimal fallback if model returns no actions (keeps UI flow working during setup)
    if (!actions.length) {
      const risk = String(profile?.risk || "medium");
      const fallbackMap: Record<string, Array<{ symbol: string; reason: string; fit_score: number }>> = {
        low: [
          { symbol: "VOO", reason: "Broad S&P 500 exposure for low risk.", fit_score: 0.9 },
          { symbol: "MSFT", reason: "Mega-cap, diversified revenue.", fit_score: 0.85 },
        ],
        medium: [
          { symbol: "AAPL", reason: "Strong brand, cash flow, wide moat.", fit_score: 0.82 },
          { symbol: "MSFT", reason: "Cloud growth and stability.", fit_score: 0.8 },
        ],
        high: [
          { symbol: "NVDA", reason: "AI demand tailwinds, higher volatility.", fit_score: 0.78 },
          { symbol: "TSLA", reason: "Growth oriented, higher volatility.", fit_score: 0.72 },
        ],
      };
      const picks = fallbackMap[risk] || fallbackMap["medium"];
      actions = [{ type: "recommend_stocks", data: picks } as any];
    }

    return NextResponse.json({ actions });
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "advisor timeout" : (e?.message || "advisor failed");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
