import { NextResponse } from "next/server";

export const runtime = "edge";

interface SuggestionRequest {
  riskTolerance?: string; // low | medium | high
  timeHorizon?: string; // e.g., 1Y, 3Y
  style?: string; // growth | value | longterm | swing | day
  experience?: string; // beginner | intermediate | expert
}

function pct(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function price(n: number) {
  return Math.round(n * 100) / 100;
}

function pickByStyle(style?: string) {
  // basic style-driven universe
  const universes: Record<string, { symbol: string; name: string }[]> = {
    growth: [
      { symbol: "NVDA", name: "NVIDIA" },
      { symbol: "TSLA", name: "Tesla" },
      { symbol: "SHOP", name: "Shopify" },
    ],
    value: [
      { symbol: "BRK.B", name: "Berkshire Hathaway" },
      { symbol: "JNJ", name: "Johnson & Johnson" },
      { symbol: "PG", name: "Procter & Gamble" },
    ],
    longterm: [
      { symbol: "AAPL", name: "Apple" },
      { symbol: "MSFT", name: "Microsoft" },
      { symbol: "GOOGL", name: "Alphabet" },
    ],
    swing: [
      { symbol: "AMD", name: "Advanced Micro Devices" },
      { symbol: "SQ", name: "Block" },
      { symbol: "ROKU", name: "Roku" },
    ],
    day: [
      { symbol: "META", name: "Meta Platforms" },
      { symbol: "NFLX", name: "Netflix" },
      { symbol: "COIN", name: "Coinbase" },
    ],
  };
  return universes[style ?? "longterm"] ?? universes["longterm"];
}

function mockMetrics(style?: string, risk?: string) {
  // rudimentary metrics: lower P/E for value, higher for growth
  const basePE = style === "value" ? 14 : style === "growth" ? 35 : 22;
  const pe = Math.max(5, Math.round(basePE + (risk === "high" ? 6 : risk === "low" ? -4 : 0)));
  const eps = (Math.random() * 8 + 1).toFixed(2);
  const dy = style === "value" ? (Math.random() * 2 + 1).toFixed(2) : (Math.random() * 0.8).toFixed(2);
  return { pe, eps: Number(eps), dy: Number(dy) };
}

function reasoning(style?: string, risk?: string) {
  const align =
    style === "value"
      ? "Matches your value investing approach"
      : style === "growth"
      ? "Aligned with your growth preference"
      : style === "swing"
      ? "Suitable for medium-term swing setups"
      : style === "day"
      ? "High-liquidity, intraday candidates"
      : "Quality large-cap for long-term compounding";
  const riskLine = risk === "high" ? " higher volatility accepted" : risk === "low" ? " lower drawdowns prioritized" : " balanced risk";
  return `${align}; ${riskLine}.`;
}

function bhSignal(risk?: string) {
  return risk === "low" ? "Hold" : risk === "high" ? "Buy" : "Buy";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeRating(params: {
  style?: string;
  risk?: string;
  type: "equity" | "crypto" | "forex";
  pe?: number;
  eps?: number;
  dy?: number;
  symbol?: string;
}) {
  const { style, risk, type, pe, eps, dy, symbol } = params;
  let score = 3; // start neutral

  // Style alignment factors
  if (style === "value" && type === "equity") {
    if (typeof pe === "number" && pe <= 18) score += 0.7;
    if (typeof dy === "number" && dy >= 1.5) score += 0.4;
  }
  if (style === "growth" && type === "equity") {
    if (typeof pe === "number" && pe >= 25) score += 0.6;
    if (typeof eps === "number" && eps >= 3) score += 0.4;
  }
  if (style === "longterm" && type === "equity") {
    const megacaps = new Set(["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "BRK.B", "JNJ"]);
    if (symbol && megacaps.has(symbol)) score += 0.6;
  }
  if (style === "swing") {
    if (type === "equity") score += 0.2;
    if (type === "crypto" || type === "forex") score += 0.3;
  }
  if (style === "day") {
    if (type === "crypto" || type === "forex") score += 0.6;
  }

  // Risk alignment factors
  if (risk === "high") {
    if (type === "crypto" || type === "forex") score += 0.6;
  } else if (risk === "low") {
    if (type === "equity") score += 0.3;
    if (type === "crypto" || type === "forex") score -= 0.3;
  }

  // Normalize and clamp
  score = clamp(score, 1, 5);
  return Number(score.toFixed(1));
}

export async function POST(req: Request) {
  let payload: SuggestionRequest = {};
  try {
    payload = await req.json();
  } catch {}

  const risk = (payload.riskTolerance || "medium").toLowerCase();
  const style = (payload.style || "longterm").toLowerCase();

  const base = pickByStyle(style);

  // expand equity universe to at least 20
  const equityUniverseRaw: { symbol: string; name: string }[] = [
    ...base,
    { symbol: "AAPL", name: "Apple" },
    { symbol: "MSFT", name: "Microsoft" },
    { symbol: "GOOGL", name: "Alphabet" },
    { symbol: "AMZN", name: "Amazon" },
    { symbol: "META", name: "Meta Platforms" },
    { symbol: "NVDA", name: "NVIDIA" },
    { symbol: "TSLA", name: "Tesla" },
    { symbol: "AMD", name: "Advanced Micro Devices" },
    { symbol: "NFLX", name: "Netflix" },
    { symbol: "BRK.B", name: "Berkshire Hathaway" },
    { symbol: "JNJ", name: "Johnson & Johnson" },
    { symbol: "PG", name: "Procter & Gamble" },
    { symbol: "XOM", name: "Exxon Mobil" },
    { symbol: "V", name: "Visa" },
    { symbol: "MA", name: "Mastercard" },
    { symbol: "JPM", name: "JPMorgan Chase" },
    { symbol: "KO", name: "Coca-Cola" },
    { symbol: "PEP", name: "PepsiCo" },
    { symbol: "DIS", name: "Walt Disney" },
    { symbol: "BA", name: "Boeing" },
  ];
  // dedupe by symbol and cap at 20
  const seenEq = new Set<string>();
  const equityUniverse = equityUniverseRaw.filter((e) => {
    if (seenEq.has(e.symbol)) return false;
    seenEq.add(e.symbol);
    return true;
  }).slice(0, 20);

  // mock price and changes
  const equities = equityUniverse.map((b) => {
    const m = mockMetrics(style, risk);
    const signal = bhSignal(risk);
    const rating = computeRating({ style, risk, type: "equity", pe: m.pe, eps: m.eps, dy: m.dy, symbol: b.symbol });
    return {
      type: "equity" as const,
      symbol: b.symbol,
      name: b.name,
      price: price(50 + Math.random() * 400),
      change1D: pct((Math.random() - 0.5) * 2),
      change1W: pct((Math.random() - 0.5) * 5),
      change1M: pct((Math.random() - 0.5) * 10),
      pe: m.pe,
      eps: m.eps,
      dy: m.dy,
      signal,
      rating,
      reasoning: `${reasoning(style, risk)} Signal: ${signal}.`,
    };
  });

  // crypto list (20)
  const cryptoList = [
    { symbol: "BTC-USD", name: "Bitcoin" },
    { symbol: "ETH-USD", name: "Ethereum" },
    { symbol: "USDT-USD", name: "Tether" },
    { symbol: "BNB-USD", name: "BNB" },
    { symbol: "SOL-USD", name: "Solana" },
    { symbol: "XRP-USD", name: "XRP" },
    { symbol: "ADA-USD", name: "Cardano" },
    { symbol: "DOGE-USD", name: "Dogecoin" },
    { symbol: "TRX-USD", name: "TRON" },
    { symbol: "TON-USD", name: "Toncoin" },
    { symbol: "DOT-USD", name: "Polkadot" },
    { symbol: "MATIC-USD", name: "Polygon" },
    { symbol: "LTC-USD", name: "Litecoin" },
    { symbol: "BCH-USD", name: "Bitcoin Cash" },
    { symbol: "LINK-USD", name: "Chainlink" },
    { symbol: "ATOM-USD", name: "Cosmos" },
    { symbol: "ETC-USD", name: "Ethereum Classic" },
    { symbol: "XLM-USD", name: "Stellar" },
    { symbol: "NEAR-USD", name: "NEAR Protocol" },
    { symbol: "AAVE-USD", name: "Aave" },
  ];
  const crypto = cryptoList.slice(0, 20).map((c) => {
    const m = mockMetrics(style, risk);
    const signal = bhSignal(risk);
    const rating = computeRating({ style, risk, type: "crypto", pe: m.pe, eps: m.eps, dy: m.dy, symbol: c.symbol });
    return {
      type: "crypto" as const,
      symbol: c.symbol,
      name: c.name,
      price: price(10 + Math.random() * 50000),
      change1D: pct((Math.random() - 0.5) * 6),
      change1W: pct((Math.random() - 0.5) * 15),
      change1M: pct((Math.random() - 0.5) * 30),
      pe: m.pe,
      eps: m.eps,
      dy: m.dy,
      signal,
      rating,
      reasoning: `${reasoning(style, risk)} Signal: ${signal}.`,
    };
  });

  // forex list (20)
  const fxList = [
    { symbol: "EURUSD", name: "Euro / US Dollar" },
    { symbol: "USDJPY", name: "US Dollar / Japanese Yen" },
    { symbol: "GBPUSD", name: "British Pound / US Dollar" },
    { symbol: "AUDUSD", name: "Australian Dollar / US Dollar" },
    { symbol: "USDCAD", name: "US Dollar / Canadian Dollar" },
    { symbol: "USDCHF", name: "US Dollar / Swiss Franc" },
    { symbol: "NZDUSD", name: "New Zealand Dollar / US Dollar" },
    { symbol: "EURJPY", name: "Euro / Japanese Yen" },
    { symbol: "EURGBP", name: "Euro / British Pound" },
    { symbol: "EURCHF", name: "Euro / Swiss Franc" },
    { symbol: "GBPJPY", name: "British Pound / Japanese Yen" },
    { symbol: "AUDJPY", name: "Australian Dollar / Japanese Yen" },
    { symbol: "CADJPY", name: "Canadian Dollar / Japanese Yen" },
    { symbol: "CHFJPY", name: "Swiss Franc / Japanese Yen" },
    { symbol: "EURNZD", name: "Euro / New Zealand Dollar" },
    { symbol: "GBPCAD", name: "British Pound / Canadian Dollar" },
    { symbol: "AUDCAD", name: "Australian Dollar / Canadian Dollar" },
    { symbol: "AUDNZD", name: "Australian Dollar / New Zealand Dollar" },
    { symbol: "NZDJPY", name: "New Zealand Dollar / Japanese Yen" },
    { symbol: "USDMXN", name: "US Dollar / Mexican Peso" },
  ];
  const forex = fxList.slice(0, 20).map((p) => {
    const m = mockMetrics(style, risk);
    const signal = bhSignal(risk);
    const rating = computeRating({ style, risk, type: "forex", pe: m.pe, eps: m.eps, dy: m.dy, symbol: p.symbol });
    return {
      type: "forex" as const,
      symbol: p.symbol,
      name: p.name,
      price: price(0.5 + Math.random() * 150),
      change1D: pct((Math.random() - 0.5) * 1.0),
      change1W: pct((Math.random() - 0.5) * 2.0),
      change1M: pct((Math.random() - 0.5) * 4.0),
      pe: m.pe,
      eps: m.eps,
      dy: m.dy,
      signal,
      rating,
      reasoning: `${reasoning(style, risk)} Signal: ${signal}.`,
    };
  });

  return NextResponse.json({ suggestions: [...equities, ...crypto, ...forex] });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
