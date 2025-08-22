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

export default async function AcademyTermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = TERMS[slug];
  if (!entry) return notFound();
  // SEO-optimized educational content for each term
  const SEO_DESCRIPTIONS: Record<string, string> = {
    "pe-ratio": `
      <b>P/E Ratio (Price-to-Earnings Ratio) — In-Depth Educational Guide</b><br/><br/>
      The P/E Ratio, or Price-to-Earnings Ratio, is one of the most widely used metrics in stock market analysis. It measures how much investors are willing to pay for a dollar of a company’s earnings. A lower P/E can indicate a cheaper valuation, but context is critical. This metric is calculated by dividing a company’s current share price by its earnings per share (EPS). For example, if a company’s stock is trading at $50 and its EPS is $5, the P/E ratio is 10. This means investors are paying $10 for every $1 of earnings.<br/><br/>
      <b>Why Does the P/E Ratio Matter?</b><br/>
      The P/E ratio helps investors compare the valuation of different companies, especially within the same industry. Growth companies often have higher P/E ratios because investors expect higher future earnings. Conversely, mature or cyclical companies may trade at lower P/E ratios. However, a very low P/E could signal underlying problems, such as declining earnings or sector-specific risks.<br/><br/>
      <b>Types of P/E Ratios</b><br/>
      - <b>Trailing P/E:</b> Based on earnings from the past 12 months.<br/>
      - <b>Forward P/E:</b> Based on projected earnings for the next 12 months.<br/>
      Both types offer unique insights. Trailing P/E shows what a company has achieved, while forward P/E reflects market expectations.<br/><br/>
      <b>Limitations of the P/E Ratio</b><br/>
      The P/E ratio should not be used in isolation. It does not account for growth rates, debt, or cash flow. For example, two companies with the same P/E might have vastly different growth prospects. Additionally, companies with negative earnings will have a meaningless or negative P/E ratio.<br/><br/>
      <b>How to Use the P/E Ratio Effectively</b><br/>
      - <b>Compare within industries:</b> Different sectors have different average P/E ratios.<br/>
      - <b>Look at historical averages:</b> Is the current P/E above or below the company’s norm?<br/>
      - <b>Combine with other metrics:</b> Use alongside PEG ratio, price-to-book, and free cash flow.<br/><br/>
      <b>Conclusion</b><br/>
      The P/E ratio is a powerful tool for investors, but it is most effective when used as part of a broader analysis. Always consider industry context, growth rates, and company fundamentals when evaluating a stock’s P/E ratio.
    `,
    "eps": `
      <b>EPS (Earnings Per Share) — Comprehensive Educational Overview</b><br/><br/>
      Earnings Per Share (EPS) is a fundamental metric that indicates how much profit a company generates for each share of its stock. It is calculated by dividing net income by the number of outstanding shares. EPS is crucial for investors because it provides a clear measure of profitability and is used in many other financial ratios, such as the P/E ratio.<br/><br/>
      <b>Types of EPS</b><br/>
      - <b>Basic EPS:</b> Uses the actual number of outstanding shares.<br/>
      - <b>Diluted EPS:</b> Accounts for potential dilution from convertible securities, options, or warrants.<br/><br/>
      <b>Why is EPS Important?</b><br/>
      Rising EPS over time generally signals improving profitability and can lead to higher stock prices. Companies with strong, consistent EPS growth are often viewed as stable investments. EPS also helps investors compare profitability across companies of different sizes.<br/><br/>
      <b>Limitations of EPS</b><br/>
      EPS can be manipulated through share buybacks or accounting practices. It does not account for capital structure, cash flow, or growth potential. Always look at EPS trends over multiple periods and combine with other metrics.<br/><br/>
      <b>EPS and Investor Decision-Making</b><br/>
      - <b>Compare EPS growth rates:</b> Are profits accelerating or slowing down?<br/>
      - <b>Look at industry benchmarks:</b> How does the company’s EPS compare to peers?<br/>
      - <b>Use with other ratios:</b> Combine EPS with P/E, ROE, and free cash flow for a fuller picture.<br/><br/>
      <b>Conclusion</b><br/>
      EPS is a key indicator of a company’s profitability. While it is a valuable tool, it should be part of a comprehensive analysis that includes multiple financial metrics and qualitative factors.
    `,
    // ... similar entries for each term ...
  };

  const seoContent = SEO_DESCRIPTIONS[slug] || "";

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
        {seoContent && (
          <div className="mt-8 prose prose-lg text-black" dangerouslySetInnerHTML={{ __html: seoContent }} />
        )}
      </div>
    </main>
  );
}

export function generateStaticParams() {
  return Object.keys(TERMS).map((slug) => ({ slug }));
}
