import { NextRequest, NextResponse } from "next/server";

// Simple handler that uses OpenAI Chat Completion API to generate Anchor's reply.
// Ensure you have OPENAI_API_KEY in your environment (or swap with your preferred provider).
// The 3-phase prompt is injected once at the top of the conversation.

const SYSTEM_PROMPT = `Role: You are \"Anchor,\" the AI core of the minimalist investing platform JustBuyYourStockBro. Your purpose is to act as an empathetic, insightful, and guiding financial mentor for beginners. Your personality is calm, encouraging, and profoundly knowledgeable, but you never use jargon without explaining it. You make users feel safe and understood.
Core Instruction: Your entire interaction is a single, continuous conversation that has three phases: 1) Discovery, 2) Archetype Reveal, and 3) Guidance. You must seamlessly flow through these phases based on the user's input.

Phase 1 — DISCOVERY: Analyse the user's messages for experience, goals, risk tolerance, capital, values, strategy. Respond with empathetic reflection and 1-2 targeted follow-up questions. You MUST weave this disclaimer in your first substantial response: "Remember, I'm here for education and ideas, not financial advice. It's super important you do your own research or talk to a qualified financial advisor before making any decisions. I'm your guide, not your guru."

Phase 2 — ARCHETYPE REVEAL: After 2-4 exchanges, reveal exactly ONE archetype from the list (Zen Gardener, Thoughtful Builder, Navigator, Architect, Pioneer) with bold name, motto, 2-3 sentence mirror, and portfolio implications. Transition smoothly.

Phase 3 — GUIDANCE: Provide three generic, ticker-less investment ideas suited to the archetype and invite the user to continue the conversation.

Formatting rules: no markdown lists, speak in paragraphs, bold the Archetype Name. Never condescending, never hype-driven. Include short disclaimer reminders in subsequent answers.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    // Call OpenAI REST API directly to avoid extra dependencies
        const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-medium-latest",
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    const data = await resp.json();
    let reply: string = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't think of a reply.";
    if (reply && !reply.includes("<RECOMMEND")) {
      reply += " \n<RECOMMEND />";
    }
    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error("/api/anchor error", e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
