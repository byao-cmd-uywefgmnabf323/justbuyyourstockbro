import { notFound } from "next/navigation";
import Link from "next/link";

const TERMS: Record<string, { term: string; definition: string; details: string[] }> = {
  "pe-ratio": {
    term: "P/E Ratio",
    definition: "Price-to-Earnings compares a company’s share price to its earnings; lower can imply a cheaper valuation (all else equal).",
    details: [
      "Formula: Price per Share ÷ Earnings per Share (EPS).",
      "Compare within the same industry; growth companies often carry higher P/E.",
      "Use alongside growth, margins, and cash flow for context.",
    ],
  },
  eps: {
    term: "EPS",
    definition: "Earnings Per Share is a company’s profit divided by the number of shares outstanding.",
    details: [
      "Basic vs. Diluted EPS accounts for potential share dilution.",
      "Rising EPS over time can signal improving profitability.",
    ],
  },
  "dividend-yield": {
    term: "Dividend Yield",
    definition: "Annual dividends as a percentage of the current share price.",
    details: [
      "Formula: Annual Dividend per Share ÷ Price per Share.",
      "A very high yield can be a red flag if dividends are unsustainable.",
    ],
  },
  "market-cap": {
    term: "Market Cap",
    definition: "Company’s total market value: share price × shares outstanding.",
    details: [
      "Categories: Large-, Mid-, Small-cap (varies by market).",
      "Often used as a proxy for company size and risk profile.",
    ],
  },
  beta: {
    term: "Beta",
    definition: "Measures a stock’s volatility vs. the market (1.0 ≈ market-like; 0.8 ≈ 20% less volatile).",
    details: [
      ">1 means more volatile than market; <1 means less volatile.",
      "Useful for risk profiling and portfolio construction.",
    ],
  },
  "52-week-range": {
    term: "52-Week Range",
    definition: "The highest and lowest trading prices over the last 52 weeks.",
    details: [
      "Shows a stock’s recent trading extremes.",
      "Does not indicate future direction by itself.",
    ],
  },
  "free-cash-flow": {
    term: "Free Cash Flow (FCF)",
    definition: "Cash a company generates after operating and capital expenses; fuels dividends, buybacks, and growth.",
    details: [
      "Formula: Operating Cash Flow − Capital Expenditures.",
      "Positive, growing FCF can support shareholder returns.",
    ],
  },
  "pb-ratio": {
    term: "P/B Ratio",
    definition: "Price-to-Book compares market value to book value (assets − liabilities).",
    details: [
      "Often used for financials and asset-heavy businesses.",
      "Compare within the same industry; intangible assets can distort P/B.",
    ],
  },
  roe: {
    term: "Return on Equity (ROE)",
    definition: "Profitability metric: net income divided by shareholder equity.",
    details: [
      "Higher ROE can indicate efficient use of capital (watch leverage).",
      "Compare peers over multi-year periods.",
    ],
  },
  rsi: {
    term: "Relative Strength Index (RSI)",
    definition: "Momentum oscillator (0–100) indicating overbought (>70) or oversold (<30) conditions.",
    details: [
      "Common setting: 14 periods.",
      "Combine with trend and support/resistance for signals.",
    ],
  },
  macd: {
    term: "MACD",
    definition: "Trend/momentum indicator using moving averages to show changes in strength, direction, and momentum.",
    details: [
      "Common settings: 12, 26, 9 (EMAs).",
      "Watch crossovers and divergence with price.",
    ],
  },
};

export default function AcademyTermPage({ params }: { params: { slug: string } }) {
  const entry = TERMS[params.slug];
  if (!entry) return notFound();
  return (
    <main className="min-h-screen py-10">
      <div className="max-w-3xl mx-auto">
        <Link href="/academy" className="text-sm underline">← Back to Academy</Link>
        <h1 className="text-2xl font-bold mt-2 text-charcoal">{entry.term}</h1>
        <p className="mt-2 text-black">{entry.definition}</p>
        {entry.details?.length > 0 && (
          <ul className="mt-4 list-disc pl-5 text-black space-y-1">
            {entry.details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

export function generateStaticParams() {
  return Object.keys(TERMS).map((slug) => ({ slug }));
}
