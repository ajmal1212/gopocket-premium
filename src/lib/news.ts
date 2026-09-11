import NSE_COMPANIES from "@/data/nse-companies.json";

/**
 * Headlines about one stock, gathered from Indian financial publishers' RSS
 * feeds.
 *
 * The feeds are section feeds - markets, companies - not per-stock ones, so
 * the pool is everything recent and a stock's news is whatever in it names the
 * company. That makes the matching the part that decides whether this is
 * useful; see `matcherFor`.
 */

/**
 * Which desk a feed comes from. Both are searched for a company's news; only
 * the markets desk stands in when there is none, since the companies feeds
 * also carry everything from court rulings to festival insurance.
 */
type Section = "markets" | "companies";

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  section: Section;
  /** The publisher's one- or two-sentence standfirst; empty when it only repeats the headline. */
  summary: string;
  /** Epoch milliseconds. */
  published: number;
}

/**
 * A headline as held in the pool. The description stays raw until something
 * needs it - see `summaryOf` - because cleaning every item's text at parse
 * time was the largest single cost of a refresh, for summaries of which a
 * page shows six.
 */
interface Pooled extends Omit<NewsItem, "summary"> {
  description: string;
  summary?: string;
}

interface Feed {
  source: string;
  section: Section;
  url: string;
}

/*
 * Publishers whose feeds are current and serve an honest non-browser client.
 * Moneycontrol and Business Standard answer anything that is not a browser
 * with a 403 - a deliberate block, so they are left out rather than
 * impersonated - and Moneycontrol's stock feeds stopped updating in 2024
 * anyway. Financial Express's feed URL serves an HTML page.
 */
const ET = "https://economictimes.indiatimes.com";
const BL = "https://www.thehindubusinessline.com";
const CNBC = "https://www.cnbctv18.com/commonfeeds/v1/cne/rss";

const FEEDS: Feed[] = [
  { source: "The Economic Times", section: "markets", url: `${ET}/markets/stocks/news/rssfeeds/2146842.cms` },
  { source: "The Economic Times", section: "markets", url: `${ET}/markets/rssfeeds/1977021501.cms` },
  { source: "Mint", section: "markets", url: "https://www.livemint.com/rss/markets" },
  { source: "Mint", section: "companies", url: "https://www.livemint.com/rss/companies" },
  { source: "BusinessLine", section: "markets", url: `${BL}/markets/feeder/default.rss` },
  { source: "BusinessLine", section: "companies", url: `${BL}/companies/feeder/default.rss` },
  { source: "CNBC-TV18", section: "markets", url: `${CNBC}/market.xml` },
  { source: "CNBC-TV18", section: "companies", url: `${CNBC}/business.xml` },
  { source: "NDTV Profit", section: "markets", url: "https://feeds.feedburner.com/ndtvprofit-latest" },
];

/** How long a fetched pool is reused. Headlines move in minutes, not seconds. */
const TTL_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 4000;
/**
 * Items read per feed, newest first. CNBC's feeds carry 200 items reaching back
 * a week; 120 reaches into yesterday's stories on the busiest feeds, which is
 * what a smaller company's news usually is by the time someone looks, while
 * keeping a refresh inside a Worker's CPU budget.
 */
const PER_FEED = 120;

let pool: { at: number; items: Pooled[] } | null = null;
let refreshing: Promise<Pooled[]> | null = null;

/**
 * Every recent headline across the feeds, newest first, de-duplicated.
 *
 * Cached in module scope, which on Workers means per isolate: consecutive
 * requests reuse one parse. Concurrent misses share one refresh. A feed that
 * fails or times out is skipped - a missing publisher costs some headlines,
 * never the page.
 */
async function recentNews(): Promise<Pooled[]> {
  if (pool && Date.now() - pool.at < TTL_MS) return pool.items;

  refreshing ??= Promise.allSettled(FEEDS.map(fetchFeed))
    .then((results) => {
      const all = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
      const items = dedupe(all.sort((a, b) => b.published - a.published));
      // An empty refresh - every feed down - keeps the last good pool.
      if (items.length > 0 || !pool) pool = { at: Date.now(), items };
      return pool.items;
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

async function fetchFeed(feed: Feed): Promise<Pooled[]> {
  const response = await fetch(feed.url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; GoPocketNews/1.0; +https://gopocket.in)",
      Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.5",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    // Cloudflare keeps the feed at the edge, so a fresh isolate usually skips
    // the publisher altogether. Other runtimes ignore the option.
    cf: { cacheTtl: TTL_MS / 1000, cacheEverything: true },
  } as RequestInit);
  if (!response.ok) return [];
  return parseFeed(await response.text(), feed);
}

const ITEM = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
const TITLE = /<title\b[^>]*>([\s\S]*?)<\/title>/i;
const LINK = /<link\b[^>]*>([\s\S]*?)<\/link>/i;
const GUID = /<guid\b[^>]*>([\s\S]*?)<\/guid>/i;
const PUB_DATE = /<pubDate\b[^>]*>([\s\S]*?)<\/pubDate>/i;
const DESCRIPTION = /<description\b[^>]*>([\s\S]*?)<\/description>/i;

/**
 * A summary's length, cut at a word. The page clamps it to two lines anyway;
 * trimming here keeps the Economic Times' longer standfirsts out of the HTML
 * that the clamp would hide.
 */
const SUMMARY_CHARS = 220;

const summarise = (description: string, title: string): string => {
  if (!description || title.toLowerCase().includes(description.toLowerCase())) return "";
  if (description.length <= SUMMARY_CHARS) return description;
  const cut = description.slice(0, SUMMARY_CHARS);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.–-]+$/, "")}…`;
};

/** An item's summary, cleaned the first time it is asked for and kept on the item for the life of the pool. */
const summaryOf = (item: Pooled): string => (item.summary ??= summarise(text(item.description), item.title));

const toNews = (item: Pooled): NewsItem => ({
  title: item.title,
  link: item.link,
  source: item.source,
  section: item.section,
  summary: summaryOf(item),
  published: item.published,
});

/**
 * RSS 2.0, read with a handful of regexes rather than an XML parser: Workers
 * have no DOMParser, the fields needed are five flat tags, and a parser
 * dependency would be bytes in every server response for that.
 */
function parseFeed(xml: string, { source, section }: Feed): Pooled[] {
  const items: Pooled[] = [];
  let read = 0;
  for (const match of xml.matchAll(ITEM)) {
    if (++read > PER_FEED) break;
    const body = match[1];
    const title = text(body.match(TITLE)?.[1]);
    const link = text(body.match(LINK)?.[1]) || text(body.match(GUID)?.[1]);
    const published = Date.parse(text(body.match(PUB_DATE)?.[1]));
    if (!title || !/^https?:\/\//.test(link) || !Number.isFinite(published)) continue;
    // Mint publishes an auto-generated "X Share Price Live Updates" stub per
    // stock; it carries no story and would crowd out the ones that do.
    if (/share price live updates/i.test(title)) continue;
    const description = body.match(DESCRIPTION)?.[1] ?? "";
    items.push({ title, link, source, section, description, published });
  }
  return items;
}

/**
 * Tag content to plain text: CDATA unwrapped, entities decoded, markup and runs
 * of whitespace dropped. Two publisher quirks are cleaned up on the way: Mint
 * double-encodes some spaces (`&amp;nbsp;`), which one decode leaves as a
 * literal "&nbsp;", and BusinessLine's text carries zero-width characters.
 */
function text(raw: string | undefined): string {
  if (!raw) return "";
  return decodeEntities(raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"))
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/[​-‍⁠﻿]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === "#") {
      const point = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
    }
    return NAMED[code.toLowerCase()] ?? entity;
  });
}

/** The Economic Times files most stock stories in both of its feeds. */
function dedupe(items: Pooled[]): Pooled[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ------------------------------------------------------------------------ */

const COMPANIES: Record<string, string> = NSE_COMPANIES;

/** A company's name as headlines write it - "HDFC Bank" for HDFCBANK - from NSE's equity list. */
export const companyName = (symbol: string): string | undefined => COMPANIES[symbol];

/**
 * What headlines call a company when it isn't its listed name - "SBI", "L&T",
 * "HUL" - plus the names of companies whose own name would otherwise be
 * swallowed by a bigger one ("SBI Life" is not SBI). Nifty 100 names mostly;
 * everything else matches on its NSE name.
 */
const ALIASES: Record<string, string[]> = {
  SBIN: ["SBI"],
  RELIANCE: ["RIL"],
  INFY: ["Infy"],
  LT: ["L&T"],
  "M&M": ["M&M"],
  HINDUNILVR: ["HUL"],
  MARUTI: ["Maruti Suzuki", "Maruti"],
  KOTAKBANK: ["Kotak Bank"],
  SUNPHARMA: ["Sun Pharma"],
  POWERGRID: ["Power Grid"],
  ADANIPORTS: ["Adani Ports"],
  BHARTIARTL: ["Airtel"],
  HCLTECH: ["HCLTech", "HCL Tech"],
  TECHM: ["TechM"],
  APOLLOHOSP: ["Apollo Hospitals"],
  DIVISLAB: ["Divi's Labs", "Divis Labs"],
  DRREDDY: ["Dr Reddy's", "Dr. Reddy's"],
  SBILIFE: ["SBI Life"],
  SBICARD: ["SBI Card", "SBI Cards"],
  HDFCLIFE: ["HDFC Life"],
  HDFCAMC: ["HDFC AMC"],
  ICICIPRULI: ["ICICI Prudential Life", "ICICI Pru Life"],
  ICICIGI: ["ICICI Lombard"],
  INDHOTEL: ["IHCL"],
  IOC: ["IndianOil", "Indian Oil"],
  HINDPETRO: ["HPCL"],
  LTIM: ["LTIMindtree"],
  LTTS: ["LTTS"],
  ETERNAL: ["Zomato"],
  PAYTM: ["Paytm"],
  NYKAA: ["Nykaa"],
  POLICYBZR: ["Policybazaar"],
  MOTHERSON: ["Motherson"],
  ZYDUSLIFE: ["Zydus"],
  NAUKRI: ["Info Edge", "Naukri"],
  BSE: ["BSE shares", "BSE share", "BSE stock"],
};

/**
 * Names too generic to match on their own. "BSE" the company shares its name
 * with the exchange's every index - "BSE Sensex" is not news about BSE Ltd -
 * so it is matched through its aliases only.
 */
const GENERIC = new Set(["BSE"]);

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The name as a whole phrase. Short all-caps names and acronyms (ITC, SBI,
 * L&T) must match in capitals - "itc" inside a word is not the company - while
 * written-out names match in any case, since some publishers title-case every
 * word.
 */
const phrase = (term: string) => {
  const exact = term === term.toUpperCase() && term.length <= 5;
  return new RegExp(`(?<![A-Za-z0-9])${escape(term)}(?![A-Za-z0-9])`, exact ? "g" : "gi");
};

let everyName: string[] | null = null;

/** Every listed name and alias, for finding the bigger names a small one sits inside. */
const allNames = () => (everyName ??= [...Object.values(COMPANIES), ...Object.values(ALIASES).flat()]);

/**
 * A test for whether a headline is about this company.
 *
 * It matches the company's name, its aliases, and its symbol where that is
 * distinctive (TCS, INFY) - but not inside a longer company name: "SBI" in
 * "SBI Life shares jump" and "Bank of India" in "State Bank of India" belong
 * to other companies. Those longer names are found once, from the listed names
 * and aliases, and blanked out of a headline before the company's own names
 * are looked for.
 */
export function matcherFor(symbol: string, displayName?: string): (title: string) => boolean {
  const key = `${symbol}|${displayName ?? ""}`;
  let matcher = matchers.get(key);
  if (!matcher) {
    matcher = buildMatcher(symbol, displayName);
    matchers.set(key, matcher);
  }
  return matcher;
}

/** Built once per stock per isolate: finding the bigger names walks every listed company. */
const matchers = new Map<string, (title: string) => boolean>();

function buildMatcher(symbol: string, displayName?: string): (title: string) => boolean {
  const own = [displayName, COMPANIES[symbol], ...(ALIASES[symbol] ?? [])].filter(
    (name): name is string => Boolean(name) && !GENERIC.has(name!),
  );
  const names = [...new Set(own)];

  // The symbol only where headlines would print it: letters, at least three
  // of them, and nothing generic.
  if (/^[A-Z][A-Z&]{2,}$/.test(symbol) && !GENERIC.has(symbol)) names.push(symbol);

  const patterns = names.map(phrase);
  if (patterns.length === 0) return () => false;

  const lower = new Set(names.map((name) => name.toLowerCase()));
  // A plain substring check first: it rules out all but a handful of the
  // ~2,600 names before any of them meets a regex.
  const bigger = [...new Set(allNames())]
    .filter((name) => {
      const folded = name.toLowerCase();
      if (lower.has(folded) || ![...lower].some((own) => folded.includes(own))) return false;
      return patterns.some((pattern) => test(pattern, name));
    })
    .map(phrase);

  return (title: string) => {
    const rest = bigger.reduce((value, pattern) => value.replace(pattern, " "), title);
    return patterns.some((pattern) => test(pattern, rest));
  };
}

/** `test` on a global regex advances `lastIndex`; reset it so every call starts at 0. */
function test(pattern: RegExp, value: string): boolean {
  pattern.lastIndex = 0;
  return pattern.test(value);
}

export interface StockNews {
  items: NewsItem[];
  /** False when nothing named the company and these are the latest market headlines instead. */
  related: boolean;
}

/**
 * The newest stories about a stock, or - when none of the feeds' recent items
 * name it - the newest market headlines, flagged as such so the page can say
 * so.
 *
 * Stories that name the company in their headline come first. When those don't
 * fill the list, stories that name it in the summary follow - a smaller
 * company is more often one of five stocks in a "breakout picks" piece than
 * the subject of a headline. Only the summary as shown counts, so the reason
 * each story is listed is on screen, not buried in text the reader never sees.
 */
export async function newsFor(symbol: string, displayName: string | undefined, limit = 6): Promise<StockNews> {
  const items = await recentNews();
  const about = matcherFor(symbol, displayName);

  const related = items.filter((item) => about(item.title));
  if (related.length < limit) {
    // Newest first, and stopping once the list is full, so a busy pool is
    // only read as far as it has to be.
    for (const item of items) {
      if (related.length >= limit) break;
      if (!about(item.title) && about(summaryOf(item))) related.push(item);
    }
  }

  if (related.length > 0) return { items: related.slice(0, limit).map(toNews), related: true };
  const markets = items.filter((item) => item.section === "markets").slice(0, limit);
  return { items: markets.map(toNews), related: false };
}
