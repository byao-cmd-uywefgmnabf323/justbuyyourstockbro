import Link from "next/link";

const TERMS: { slug: string; term: string; definition: string }[] = [
  { slug: "pe-ratio", term: "P/E Ratio", definition: "Price-to-Earnings compares a company’s share price to its earnings; lower can imply a cheaper valuation (all else equal)." },
  { slug: "eps", term: "EPS", definition: "Earnings Per Share is a company’s profit divided by the number of shares outstanding." },
  { slug: "dividend-yield", term: "Dividend Yield", definition: "Annual dividends as a percentage of the current share price." },
  { slug: "market-cap", term: "Market Cap", definition: "Company’s total market value: share price × shares outstanding." },
  { slug: "beta", term: "Beta", definition: "Measures a stock’s volatility vs. the market (1.0 ≈ market-like; 0.8 ≈ 20% less volatile)." },
  { slug: "52-week-range", term: "52-Week Range", definition: "The highest and lowest trading prices over the last 52 weeks." },
  { slug: "free-cash-flow", term: "Free Cash Flow (FCF)", definition: "Cash a company generates after operating and capital expenses; fuels dividends, buybacks, and growth." },
  { slug: "pb-ratio", term: "P/B Ratio", definition: "Price-to-Book compares a company’s market value to its book value (assets − liabilities)." },
  { slug: "roe", term: "Return on Equity (ROE)", definition: "Profitability metric: net income divided by shareholder equity." },
  { slug: "rsi", term: "Relative Strength Index (RSI)", definition: "Momentum oscillator (0–100) indicating overbought (>70) or oversold (<30) conditions." },
  { slug: "macd", term: "MACD", definition: "Trend/momentum indicator using moving averages to show changes in strength, direction, and momentum." },
];

export default function AcademyIndexPage() {
  return (
    <main className="min-h-screen py-10">
      <h1 className="text-2xl font-bold text-center mb-6 text-charcoal">Academy</h1>
      <p className="text-center text-sm text-black mb-6">Quick definitions for common investing terms. Click any term to learn more.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TERMS.map((t) => (
          <Link
            key={t.slug}
            href={`/academy/${t.slug}`}
            className="block p-4 border border-gray-300 bg-white hover:bg-gray-50"
          >
            <div className="font-semibold text-black">{t.term}</div>
            <div className="text-sm text-gray-800 mt-1">{t.definition}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
