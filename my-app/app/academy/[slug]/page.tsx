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
    "dividend-yield": `
      <b>Dividend Yield — A Comprehensive Guide for Investors</b><br/><br/>
      The Dividend Yield is a financial ratio that shows how much a company pays out in dividends each year relative to its stock price. It's a key metric for income-focused investors. The yield is expressed as a percentage and is calculated by dividing the annual dividend per share by the current market price per share. For example, if a stock trading at $100 pays an annual dividend of $3, its dividend yield is 3%.<br/><br/>
      <b>Why Does Dividend Yield Matter?</b><br/>
      Dividend yield is a major component of total return, alongside capital gains. A steady dividend provides a regular income stream, which can be particularly attractive in volatile markets. It also signals a company's financial health and management's confidence in future earnings, as only consistently profitable companies can afford to pay dividends.<br/><br/>
      <b>The High-Yield Trap</b><br/>
      While a high yield can be appealing, it can also be a red flag. An unusually high yield might be the result of a falling stock price, suggesting the market has concerns about the company's future. It could also indicate that the dividend is unsustainable and at risk of being cut. Always investigate the company's financial stability and dividend history before investing based on yield alone.<br/><br/>
      <b>How to Use Dividend Yield Effectively</b><br/>
      - <b>Compare within industries:</b> Yields vary significantly across sectors.<br/>
      - <b>Check the payout ratio:</b> Ensure the company can afford its dividend (Dividends / Net Income).<br/>
      - <b>Look for consistency:</b> A history of stable or growing dividends is a positive sign.<br/><br/>
      <b>Conclusion</b><br/>
      Dividend yield is a crucial metric for evaluating income-generating stocks. When used with other financial health indicators, it helps investors identify stable companies that can provide a reliable return.
    `,
    "market-cap": `
      <b>Understanding Market Cap: From Large-Cap to Micro-Cap</b><br/><br/>
      Market Capitalization, or Market Cap, represents the total dollar market value of a company's outstanding shares of stock. It is calculated by multiplying the total number of a company's outstanding shares by the current market price of one share. For instance, a company with 1 billion shares selling for $100 each would have a market cap of $100 billion.<br/><br/>
      <b>Why Does Market Cap Matter?</b><br/>
      Market cap is the primary method for determining a company's size, which often correlates with its risk and growth profile. It allows investors to categorize companies and build a diversified portfolio.<br/><br/>
      <b>Categories of Market Cap</b><br/>
      - <b>Large-Cap ($10 billion+):</b> Established, stable companies with a history of consistent growth and dividend payments (e.g., Apple, Microsoft).<br/>
      - <b>Mid-Cap ($2 billion to $10 billion):</b> Companies in a growth phase, offering a blend of the stability of large-caps and the growth potential of small-caps.<br/>
      - <b>Small-Cap ($300 million to $2 billion):</b> Younger companies with high growth potential, but also higher risk and volatility.<br/><br/>
      <b>Limitations of Market Cap</b><br/>
      Market cap reflects the market's perception of a company's value, not its intrinsic worth. It does not account for debt or cash reserves. Therefore, it should be used alongside other metrics like Enterprise Value for a more complete picture of a company's financial standing.<br/><br/>
      <b>Conclusion</b><br/>
      Market cap is a fundamental starting point for any investor. Understanding a company's size helps in assessing its potential for growth and its associated risks, enabling the construction of a well-balanced investment portfolio.
    `,
    "beta": `
      <b>What is Beta? A Guide to Stock Volatility</b><br/><br/>
      Beta is a measure of a stock's volatility, or systematic risk, in comparison to the overall market (e.g., the S&P 500). It provides a quantitative measure of how much a stock's price is expected to move when the market moves.<br/><br/>
      <b>Interpreting Beta Values</b><br/>
      - <b>Beta = 1:</b> The stock's price moves in line with the market.<br/>
      - <b>Beta > 1:</b> The stock is more volatile than the market. A beta of 1.5 means the stock is expected to move 50% more than the market in the same direction.<br/>
      - <b>Beta < 1:</b> The stock is less volatile than the market. Utility and consumer staple stocks often have low betas.<br/>
      - <b>Negative Beta:</b> The stock moves in the opposite direction of the market. This is rare, but gold is sometimes cited as an example.<br/><br/>
      <b>Why is Beta Important?</b><br/>
      Beta is essential for portfolio construction and risk management. It helps investors choose investments that align with their risk tolerance. A portfolio of low-beta stocks will be less volatile, while a portfolio with high-beta stocks has the potential for higher returns but also greater risk.<br/><br/>
      <b>Limitations of Beta</b><br/>
      Beta is a historical measure and does not predict future volatility. It also does not capture unsystematic, company-specific risk. Therefore, it should be used as one of many tools in a comprehensive analysis.<br/><br/>
      <b>Conclusion</b><br/>
      Beta is a valuable metric for assessing a stock's risk profile relative to the market. By understanding beta, investors can make more informed decisions about how to manage volatility within their portfolios.
    `,
    "52-week-range": `
      <b>The 52-Week High/Low: What It Tells Investors</b><br/><br/>
      The 52-week range indicates the highest and lowest prices at which a stock has traded over the previous 52 weeks (one year). This range provides a snapshot of the stock's recent price extremes and volatility.<br/><br/>
      <b>Why is the 52-Week Range Important?</b><br/>
      This metric gives investors context for a stock's current price. A stock trading near its 52-week high might be showing strong momentum, while a stock near its low could be undervalued or facing challenges. These levels often act as psychological points of support or resistance for traders.<br/><br/>
      <b>What the 52-Week Range Doesn't Tell You</b><br/>
      The 52-week range is a historical data point, not a predictor of future performance. A stock hitting a new 52-week high can continue to rise, and a stock at its low can fall further. It is crucial not to make investment decisions based on this metric alone.<br/><br/>
      <b>How to Use It Effectively</b><br/>
      - <b>Gauge Momentum:</b> Use it to identify stocks in strong uptrends or downtrends.<br/>
      - <b>Identify Potential Bargains:</b> A stock near its low may warrant further research to see if it's an opportunity.<br/>
      - <b>Combine with Other Indicators:</b> Use it alongside fundamental analysis and other technical indicators for a more complete picture.<br/><br/>
      <b>Conclusion</b><br/>
      The 52-week range is a simple yet useful tool for quickly assessing a stock's recent performance and volatility. It provides valuable context but should always be part of a broader investment analysis.
    `,
    "free-cash-flow": `
      <b>Free Cash Flow (FCF): The Ultimate Measure of Financial Health</b><br/><br/>
      Free Cash Flow (FCF) represents the cash a company generates after accounting for the capital expenditures necessary to maintain or expand its asset base. It is the cash left over that can be used to pay dividends, buy back stock, pay down debt, or make acquisitions. Many consider it the true measure of a company's profitability.<br/><br/>
      <b>Why is FCF So Important?</b><br/>
      Unlike earnings, which can be affected by accounting rules and non-cash expenses, FCF is much harder to manipulate. It shows a company's ability to generate cash and its financial flexibility. Consistently positive and growing FCF is a strong sign of a healthy business.<br/><br/>
      <b>How to Use FCF</b><br/>
      - <b>FCF Yield:</b> (FCF per Share / Stock Price) provides a valuation metric similar to an earnings yield.<br/>
      - <b>FCF Growth:</b> A history of rising FCF indicates a strong and growing business.<br/>
      - <b>Debt Management:</b> FCF shows if a company can service its debt without needing to raise more capital.<br/><br/>
      <b>Conclusion</b><br/>
      Free Cash Flow is one of the most critical metrics for fundamental analysis. It provides a clear view of a company's ability to generate value for its shareholders and is a hallmark of a high-quality business.
    `,
    "pb-ratio": `
      <b>P/B Ratio (Price-to-Book): Valuing Companies Based on Assets</b><br/><br/>
      The Price-to-Book (P/B) ratio compares a company's market capitalization to its book value. Book value is the net asset value of a company, calculated as total assets minus intangible assets and liabilities. The P/B ratio indicates what investors are willing to pay for each dollar of a company's net assets.<br/><br/>
      <b>When is the P/B Ratio Useful?</b><br/>
      The P/B ratio is most effective for valuing asset-heavy businesses like banks, insurance companies, and industrial firms. For these companies, book value can be a reasonable proxy for intrinsic value. A P/B ratio below 1 may suggest that a stock is undervalued.<br/><br/>
      <b>Limitations of the P/B Ratio</b><br/>
      This ratio is less useful for service-based or technology companies with significant intangible assets (like brand value or intellectual property) that are not reflected on the balance sheet. Additionally, book value is based on historical costs, which may not reflect the true current value of assets.<br/><br/>
      <b>Conclusion</b><br/>
      The P/B ratio is a classic value investing metric that helps identify potentially undervalued stocks in asset-intensive sectors. However, like all ratios, it should be used in context and compared with industry peers.
    `,
    "roe": `
      <b>Return on Equity (ROE): Measuring a Company's Profitability</b><br/><br/>
      Return on Equity (ROE) is a measure of financial performance calculated by dividing net income by shareholders' equity. It reveals how much profit a company generates with the money shareholders have invested. A higher ROE indicates that a company is more efficient at using its equity base to create profits.<br/><br/>
      <b>Why is ROE Important?</b><br/>
      ROE is a powerful tool for comparing the profitability of companies within the same industry. A consistently high ROE can be a sign of a strong competitive advantage, or 'moat'. Investors often look for companies with stable and high ROE.<br/><br/>
      <b>Potential Pitfalls</b><br/>
      A very high ROE is not always a good sign. It can be artificially inflated by high levels of debt, which reduces shareholders' equity. Therefore, it's important to analyze a company's debt levels alongside its ROE.<br/><br/>
      <b>Conclusion</b><br/>
      Return on Equity is a key indicator of a company's profitability and efficiency. When analyzed over time and in comparison to peers, it provides valuable insights into a company's financial health and competitive standing.
    `,
    "rsi": `
      <b>Relative Strength Index (RSI): A Key Momentum Indicator</b><br/><br/>
      The Relative Strength Index (RSI) is a momentum oscillator used in technical analysis that measures the speed and change of price movements. The RSI oscillates between zero and 100 and is typically used to identify overbought or oversold conditions in a stock.<br/><br/>
      <b>How to Interpret RSI</b><br/>
      - <b>Overbought:</b> An RSI reading above 70 is generally considered overbought and may suggest that a stock is due for a pullback.<br/>
      - <b>Oversold:</b> An RSI reading below 30 is generally considered oversold and may indicate that a stock is due for a bounce.<br/>
      - <b>Divergence:</b> When the price makes a new high but the RSI does not, it's called a bearish divergence and can signal a potential reversal. The opposite is a bullish divergence.<br/><br/>
      <b>Using RSI Effectively</b><br/>
      RSI is most effective when used in conjunction with other technical indicators and chart patterns. It is not a standalone signal for buying or selling. For example, a trader might wait for an oversold RSI reading to coincide with a key support level before entering a long position.<br/><br/>
      <b>Conclusion</b><br/>
      The RSI is a popular and versatile tool for technical traders. It helps identify potential reversals, gauge momentum, and confirm trends, making it a valuable addition to any technical analysis toolkit.
    `,
    "macd": `
      <b>MACD (Moving Average Convergence Divergence): A Trend-Following Indicator</b><br/><br/>
      The Moving Average Convergence Divergence (MACD) is a trend-following momentum indicator that shows the relationship between two moving averages of a security’s price. The MACD is calculated by subtracting the 26-period Exponential Moving Average (EMA) from the 12-period EMA. A nine-day EMA of the MACD, called the 'signal line', is then plotted on top of the MACD line, which can function as a trigger for buy and sell signals.<br/><br/>
      <b>How to Read the MACD</b><br/>
      - <b>Crossovers:</b> When the MACD line crosses above the signal line, it is a bullish signal. When it crosses below, it is a bearish signal.<br/>
      - <b>Centerline Crossovers:</b> When the MACD line crosses above zero, it indicates positive momentum. When it crosses below zero, it indicates negative momentum.<br/>
      - <b>Divergence:</b> As with the RSI, divergence between the MACD and the price can signal a potential trend reversal.<br/><br/>
      <b>Why is MACD Useful?</b><br/>
      The MACD helps traders identify the strength, direction, momentum, and duration of a trend. Its combination of trend and momentum makes it a powerful and widely used indicator.<br/><br/>
      <b>Conclusion</b><br/>
      The MACD is a fundamental tool for technical analysts. By providing clear buy and sell signals through crossovers and divergences, it helps traders make more informed decisions about trend and momentum.
    `,
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
