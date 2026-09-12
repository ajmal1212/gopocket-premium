/**
 * The instruments offered in the header search before anything is typed.
 *
 * Tokens and slugs are verified against Contract Master and baked in rather
 * than looked up per request: the search popup renders inside the layout, so a
 * query here would run on every page of the site to populate a list that
 * changes a few times a year.
 *
 * `key` is the feed token and `slug` the page's canonical address - the company
 * name for a share (see `slugFor` in contracts.ts) - so a row links straight to
 * its own stock page, with no redirect, and subscribes to its own price.
 */
export interface TrendingScrip {
  /** Feed token, "EXCHANGE|TOKEN". */
  key: string;
  symbol: string;
  exchange: string;
  /** Company name as a reader would say it. */
  name: string;
  slug: string;
}

export const TRENDING: TrendingScrip[] = [
  { key: "NSE|2885", symbol: "RELIANCE", exchange: "NSE", name: "Reliance Industries", slug: "reliance-industries" },
  { key: "NSE|1333", symbol: "HDFCBANK", exchange: "NSE", name: "HDFC Bank", slug: "hdfc-bank" },
  {
    key: "NSE|11536",
    symbol: "TCS",
    exchange: "NSE",
    name: "Tata Consultancy Services",
    slug: "tata-consultancy-services",
  },
  { key: "NSE|1594", symbol: "INFY", exchange: "NSE", name: "Infosys", slug: "infosys" },
  { key: "NSE|4963", symbol: "ICICIBANK", exchange: "NSE", name: "ICICI Bank", slug: "icici-bank" },
  { key: "NSE|3045", symbol: "SBIN", exchange: "NSE", name: "State Bank of India", slug: "state-bank-of-india" },
  { key: "NSE|1660", symbol: "ITC", exchange: "NSE", name: "ITC", slug: "itc" },
  { key: "NSE|26000", symbol: "NIFTY 50", exchange: "INDICES", name: "Nifty 50", slug: "nifty-50" },
];
