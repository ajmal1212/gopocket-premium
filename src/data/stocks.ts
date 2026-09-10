/**
 * The stock pages the site publishes.
 *
 * Contract Master cannot drive this on its own: it holds `SBIN` and `SBIN-EQ`
 * but no company name, no description and no sector, its `pdc` is zeroed, and
 * its rows are regenerated daily - so nothing durable can key off them. Slugs
 * and copy live here instead, and the token is what ties a page to the feed.
 *
 * Deliberately a curated list rather than all 3,162 NSE equities: a few hundred
 * pages that say something rank, while three thousand near-identical ones read
 * as thin content.
 */
export interface StockPage {
  /** URL segment: /stocks/<slug> */
  slug: string;
  /** Company name, as a reader would say it. */
  name: string;
  /** Trading symbol, e.g. "SBIN". */
  symbol: string;
  exchange: "NSE" | "BSE";
  /** Feed token; the page subscribes to `${exchange}|${token}`. */
  token: string;
  sector: string;
  /** Two or three sentences. Shown on the page and used as its meta description. */
  description: string;
}

export const STOCKS: StockPage[] = [
  {
    slug: "sbin-eq",
    name: "State Bank of India",
    symbol: "SBIN",
    exchange: "NSE",
    token: "3045",
    sector: "Public Sector Bank",
    description:
      "State Bank of India is the country's largest public sector bank, with a balance sheet and branch network larger than any other Indian lender. Its shares trade on the NSE and BSE and are part of the Nifty 50 and Sensex.",
  },
  {
    slug: "reliance-eq",
    name: "Reliance Industries",
    symbol: "RELIANCE",
    exchange: "NSE",
    token: "2885",
    sector: "Oil, Gas & Consumer",
    description:
      "Reliance Industries spans refining and petrochemicals, telecom through Jio, and retail. It is consistently among the most heavily weighted stocks in the Nifty 50.",
  },
  {
    slug: "tcs-eq",
    name: "Tata Consultancy Services",
    symbol: "TCS",
    exchange: "NSE",
    token: "11536",
    sector: "Information Technology",
    description:
      "Tata Consultancy Services is India's largest IT services company by revenue and market capitalisation, serving banking, retail and telecom clients across more than forty countries.",
  },
];

export const stockBySlug = (slug: string): StockPage | undefined => STOCKS.find((stock) => stock.slug === slug);

export const feedToken = (stock: StockPage): string => `${stock.exchange}|${stock.token}`;
