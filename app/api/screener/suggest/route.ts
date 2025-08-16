import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { riskTolerance, timeHorizon, style, experience } = await req.json();

  // Mock suggestions
  const suggestions = [
    {
      type: "equity",
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 210.12,
      change1D: "+1.2%",
      change1W: "+3.7%",
      change1M: "+7.9%",
      reasoning: "Stable tech giant, suitable for most investors.",
    },
    {
      type: "equity",
      symbol: "TSLA",
      name: "Tesla Inc.",
      price: 265.44,
      change1D: "-0.8%",
      change1W: "+2.1%",
      change1M: "+10.2%",
      reasoning: "Higher volatility, fits growth and risk-tolerant profiles.",
    },
    {
      type: "equity",
      symbol: "NVDA",
      name: "NVIDIA Corp.",
      price: 890.23,
      change1D: "+2.5%",
      change1W: "+9.2%",
      change1M: "+15.1%",
      reasoning: "Strong momentum in AI and chips sector.",
    },
    {
      type: "crypto",
      symbol: "ETH",
      name: "Ethereum",
      price: 3200.55,
      change1D: "+0.5%",
      change1W: "+4.2%",
      change1M: "+11.8%",
      reasoning: "Major crypto asset, suitable for diversified portfolios.",
    },
    {
      type: "forex",
      symbol: "EUR/USD",
      name: "Euro/US Dollar",
      price: 1.095,
      change1D: "-0.1%",
      change1W: "+0.3%",
      change1M: "+1.2%",
      reasoning: "Most liquid forex pair, good for global exposure.",
    },
  ];

  return NextResponse.json({ suggestions });
}
