import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a seasoned investment assistant. Analyze the user's conversation and generate PERSONALIZED stock recommendations based on their specific requests.

CRITICAL: Pay close attention to:
- Specific sectors mentioned (e.g., "healthcare stocks" → JNJ, PFE, UNH)
- Investment style (growth vs value vs dividend)
- Risk tolerance and time horizon

Return STRICT JSON with this shape (NO extra text, ONLY valid JSON):
{
  "suggestions": [
    {
      "type": "equity",
      "symbol": "JNJ",
      "name": "Johnson & Johnson",
      "price": 160,
      "change1D": "+0.5%",
      "change1W": "+1.2%",
      "change1M": "+3.0%",
      "rating": 4,
      "pe": 18,
      "eps": 8.5,
      "dy": 2.8,
      "reasoning": "Healthcare leader with stable dividends",
      "signal": "Buy"
    }
  ]
}

Examples:
- "healthcare stocks" → JNJ, PFE, UNH
- "tech stocks" → AAPL, MSFT, GOOGL
- "dividend stocks" → KO, PG, VZ

Generate 3-5 suggestions. Keep reasoning short (under 50 chars). ONLY return valid JSON.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("=== AI RECOMMEND DEBUG ===");
    console.log("Received body:", JSON.stringify(body, null, 2));
    
    // Extract user request from chat messages
    const userMessage = body.chat?.[body.chat.length - 1]?.content || body.lastUserMessage || "";
    console.log("User message:", userMessage);
    
    // Simple keyword-based recommendation logic for now (bypassing AI parsing issues)
    let recommendations = [];
    
    if (userMessage.toLowerCase().includes("healthcare") || userMessage.toLowerCase().includes("health")) {
      recommendations = [
        { symbol: "JNJ", name: "Johnson & Johnson", price: 160, change1D: "-0.2%", change1W: "+0.8%", change1M: "+2.0%", rating: 4, pe: 18, eps: 7.2, dy: 2.8, reasoning: "Healthcare leader in pharmaceuticals and medical devices", signal: "Buy", type: "equity" },
        { symbol: "PFE", name: "Pfizer", price: 35, change1D: "+0.1%", change1W: "+0.5%", change1M: "+1.2%", rating: 4, pe: 15, eps: 2.3, dy: 5.8, reasoning: "Major pharmaceutical company with strong dividend yield", signal: "Buy", type: "equity" },
        { symbol: "UNH", name: "UnitedHealth Group", price: 500, change1D: "+0.5%", change1W: "+1.0%", change1M: "+3.0%", rating: 4.5, pe: 22, eps: 22.8, dy: 1.4, reasoning: "Leading health insurance and healthcare services provider", signal: "Buy", type: "equity" },
        { symbol: "ABBV", name: "AbbVie", price: 175, change1D: "+0.3%", change1W: "+1.2%", change1M: "+2.8%", rating: 4, pe: 16, eps: 10.8, dy: 3.5, reasoning: "Biopharmaceutical company with strong immunology portfolio", signal: "Buy", type: "equity" }
      ];
    } else if (userMessage.toLowerCase().includes("tech") || userMessage.toLowerCase().includes("technology")) {
      recommendations = [
        { symbol: "AAPL", name: "Apple", price: 185, change1D: "+0.5%", change1W: "+1.3%", change1M: "+4.2%", rating: 5, pe: 29, eps: 6.2, dy: 0.6, reasoning: "Leading technology company with strong ecosystem", signal: "Buy", type: "equity" },
        { symbol: "MSFT", name: "Microsoft", price: 410, change1D: "+0.3%", change1W: "+2.1%", change1M: "+6.0%", rating: 5, pe: 32, eps: 9.8, dy: 0.8, reasoning: "Cloud computing and enterprise software leader", signal: "Buy", type: "equity" },
        { symbol: "GOOGL", name: "Alphabet", price: 140, change1D: "+0.8%", change1W: "+1.5%", change1M: "+5.5%", rating: 4.5, pe: 27, eps: 5.8, dy: null, reasoning: "Search and advertising technology giant", signal: "Buy", type: "equity" },
        { symbol: "NVDA", name: "NVIDIA", price: 900, change1D: "+1.0%", change1W: "+3.5%", change1M: "+12.0%", rating: 4.5, pe: 40, eps: 8.0, dy: 0.1, reasoning: "AI and graphics processing leader", signal: "Buy", type: "equity" }
      ];
    } else if (userMessage.toLowerCase().includes("dividend")) {
      recommendations = [
        { symbol: "KO", name: "Coca-Cola", price: 58, change1D: "+0.1%", change1W: "+0.5%", change1M: "+1.8%", rating: 4, pe: 25, eps: 2.3, dy: 3.1, reasoning: "Dividend aristocrat with consistent payouts", signal: "Buy", type: "equity" },
        { symbol: "PG", name: "Procter & Gamble", price: 155, change1D: "+0.2%", change1W: "+0.8%", change1M: "+2.2%", rating: 4, pe: 24, eps: 6.5, dy: 2.4, reasoning: "Consumer staples with reliable dividends", signal: "Buy", type: "equity" },
        { symbol: "JNJ", name: "Johnson & Johnson", price: 160, change1D: "-0.2%", change1W: "+0.8%", change1M: "+2.0%", rating: 4, pe: 18, eps: 7.2, dy: 2.8, reasoning: "Healthcare dividend king", signal: "Buy", type: "equity" },
        { symbol: "VZ", name: "Verizon", price: 42, change1D: "-0.1%", change1W: "+0.3%", change1M: "+1.5%", rating: 3.5, pe: 9, eps: 4.7, dy: 6.2, reasoning: "Telecom with high dividend yield", signal: "Hold", type: "equity" }
      ];
    } else {
      // Default mixed portfolio
      recommendations = [
        { symbol: "AAPL", name: "Apple", price: 185, change1D: "+0.5%", change1W: "+1.3%", change1M: "+4.2%", rating: 5, pe: 29, eps: 6.2, dy: 0.6, reasoning: "Blue-chip technology leader", signal: "Buy", type: "equity" },
        { symbol: "JNJ", name: "Johnson & Johnson", price: 160, change1D: "-0.2%", change1W: "+0.8%", change1M: "+2.0%", rating: 4, pe: 18, eps: 7.2, dy: 2.8, reasoning: "Defensive healthcare play", signal: "Buy", type: "equity" },
        { symbol: "KO", name: "Coca-Cola", price: 58, change1D: "+0.1%", change1W: "+0.5%", change1M: "+1.8%", rating: 4, pe: 25, eps: 2.3, dy: 3.1, reasoning: "Dividend aristocrat", signal: "Buy", type: "equity" }
      ];
    }
    
    console.log("Returning recommendations:", recommendations);
    return NextResponse.json({ suggestions: recommendations });
  } catch (e: any) {
    return NextResponse.json({ error: "Unexpected error", detail: String(e?.message || e) }, { status: 500 });
  }
}
