import NSE_COMPANIES from "@/data/nse-companies.json";
import { edgeGet, edgePut } from "@/lib/edge-cache";
import { getFrappeUrl, getFrappeToken } from "@/lib/frappe";

/**
 * Contract Master lookups.
 *
 * Every instrument the feed carries lives in this doctype, keyed by
 * `EXCHANGE|token`. `formatted_ins_name` is the human-readable name - "SBIN-EQ",
 * "Nifty 50", "RELIANCE 29th SEP 700 CE" - and so a page exists for anything
 * that can be searched. Its URL is that name, slugified - except for a listed
 * company's shares, which are addressed by the company's name (see below).
 */

const TIMEOUT_MS = 8000;

export interface Contract {
  /** Feed token, "EXCHANGE|TOKEN", built from the *source* exchange. */
  key: string;
  token: string;
  symbol: string;
  /** Exchange to show; "INDICES" for an index. */
  exchange: string;
  /** Display name, from `formatted_ins_name`. */
  name: string;
  /** Exchange-native symbol, e.g. "HDFCBANK-EQ" - what EOD history is keyed by. */
  tradingSymbol: string;
  /** The page's one canonical address, /stocks/<slug> - see `slugFor`. */
  slug: string;
  /** Contract Master's own ranking: indices 1, NSE 2, BSE 3. */
  order: number;
}

interface ContractRow {
  token?: string;
  symbol?: string;
  exchange?: string;
  source_exchange?: string;
  trading_symbol?: string;
  formatted_ins_name?: string;
  order?: number;
}

/** "RELIANCE 29th SEP 700 CE" -> "reliance-29th-sep-700-ce" */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * A listed company's shares are addressed by the company's name -
 * /stocks/reliance-industries rather than Contract Master's "RELIANCE-EQ" -
 * and its BSE listing by the same name with "-bse" on the end, so the two
 * never meet: ITC's BSE row is plain "ITC", which would otherwise slugify to
 * the NSE page's address. Names come from nse-companies.json, the NSE list
 * (scripts/update-nse-companies.mjs); anything not on it - indices, ETFs,
 * derivatives - keeps its contract-name slug.
 */
const BSE_SUFFIX = "-bse";

let companyIndex: { slugBySymbol: Map<string, string>; symbolBySlug: Map<string, string> } | null = null;

function companies() {
  if (companyIndex) return companyIndex;

  const bySlug = new Map<string, string[]>();
  for (const [symbol, name] of Object.entries(NSE_COMPANIES as Record<string, string>)) {
    const slug = slugify(name);
    if (slug) bySlug.set(slug, [...(bySlug.get(slug) ?? []), symbol]);
  }

  const slugBySymbol = new Map<string, string>();
  const symbolBySlug = new Map<string, string>();
  for (const [slug, symbols] of bySlug) {
    // A few companies list a second class of share under the same name - a
    // DVR, a partly paid issue. The ordinary shares keep the name; the others
    // add their symbol.
    const ranked = [...symbols].sort(
      (a, b) => Number(a.includes("DVR")) - Number(b.includes("DVR")) || a.length - b.length || a.localeCompare(b),
    );
    ranked.forEach((symbol, index) => {
      const own = index === 0 ? slug : `${slug}-${slugify(symbol)}`;
      slugBySymbol.set(symbol, own);
      symbolBySlug.set(own, symbol);
    });
  }

  return (companyIndex = { slugBySymbol, symbolBySlug });
}

function slugFor(exchange: string, symbol: string, name: string): string {
  const company = companies().slugBySymbol.get(symbol);
  if (company && exchange === "NSE") return company;
  if (company && exchange === "BSE") return company + BSE_SUFFIX;
  return slugify(name);
}

/**
 * The /stocks page and display name for an NSE symbol, from the bundled company
 * list alone - no Contract Master lookup. For pages that list many symbols at
 * once (the market movers), where a request per row is out of the question.
 */
export function nseCompany(symbol: string): { slug: string; name: string } | null {
  const slug = companies().slugBySymbol.get(symbol);
  const name = (NSE_COMPANIES as Record<string, string>)[symbol];
  return slug && name ? { slug, name } : null;
}

/** The listing a company-name address stands for, or null for any other address. */
function companyListing(slug: string): { exchange: "NSE" | "BSE"; symbol: string } | null {
  const { symbolBySlug } = companies();
  const nse = symbolBySlug.get(slug);
  if (nse) return { exchange: "NSE", symbol: nse };
  const bse = slug.endsWith(BSE_SUFFIX) ? symbolBySlug.get(slug.slice(0, -BSE_SUFFIX.length)) : undefined;
  return bse ? { exchange: "BSE", symbol: bse } : null;
}

const toContract = (row: ContractRow): Contract | null => {
  /*
   * Contract Master's `formatted_ins_name` is the trading symbol, not a name:
   * Abbott India arrives as "ABBOTINDIA-EQ". nse-companies.json already holds
   * the real name for 2,568 symbols - it is what builds the page's address -
   * so it is preferred here too. Without this the company's own page was
   * titled "ABBOTINDIA-EQ (ABBOTINDIA) Share Price Today", and the <h1>,
   * meta description and search results all read the same way.
   */
  const listed = (NSE_COMPANIES as Record<string, string>)[row.symbol || ""];
  const name = listed || row.formatted_ins_name || row.trading_symbol || row.symbol || "";
  if (!row.token || !row.exchange || !name) return null;

  // An index is filed under the exchange "INDICES" but feeds as its source
  // market - Nifty 50 is INDICES in this doctype and NSE|26000 on the wire, so
  // keying the subscription off `exchange` silently yields a page with no price.
  const feedExchange = row.source_exchange || row.exchange;

  return {
    key: `${feedExchange}|${row.token}`,
    token: row.token,
    symbol: row.symbol || row.trading_symbol || name,
    exchange: row.exchange,
    name,
    tradingSymbol: row.trading_symbol || name,
    slug: slugFor(row.exchange, row.symbol || "", name),
    order: row.order ?? 99,
  };
};

/**
 * Contract Master ranks its own rows with `order` - indices 1, NSE 2, BSE 3 -
 * which is what the trading app's watchlist sorts by, and it beats a hardcoded
 * exchange table because the backend can re-rank without a deploy here.
 */
const byOrderThenSymbol = (a: Contract, b: Contract) =>
  a.order !== b.order ? a.order - b.order : a.symbol.localeCompare(b.symbol);

const FIELDS = JSON.stringify([
  "token",
  "symbol",
  "exchange",
  "source_exchange",
  "trading_symbol",
  "formatted_ins_name",
  "order",
]);

async function query(params: URLSearchParams): Promise<Contract[]> {
  // A caller must always get a list back: a page still renders without a price,
  // and a search box that throws is worse than one that finds nothing.
  try {
    const response = await fetch(`${getFrappeUrl()}/api/resource/Contract Master?${params}`, {
      headers: { Authorization: `token ${getFrappeToken()}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return [];
    const body = (await response.json()) as { data?: ContractRow[] };
    return (body.data || []).map(toContract).filter((c): c is Contract => c !== null);
  } catch {
    return [];
  }
}

/** `%` and `_` are LIKE wildcards; a stray one from a search box must match literally. */
const escapeLike = (value: string) => value.replace(/[\%_]/g, "\$&");

/**
 * The search popup's tabs, each a set of Contract Master `exchange` values.
 * The endpoint takes the id, never a list of exchanges, so a request can only
 * ask for one of these.
 */
export const SEARCH_SEGMENTS = [
  {
    id: "all",
    label: "All",
    exchanges: ["INDICES", "NSE", "BSE", "NFO", "BFO", "MCX"],
    hint: "stocks, F&O, commodities",
  },
  { id: "stocks", label: "Stocks", exchanges: ["NSE", "BSE"], hint: "NSE and BSE stocks, e.g. SBIN" },
  { id: "nfo", label: "NFO", exchanges: ["NFO"], hint: "NSE futures & options, e.g. NIFTY" },
  { id: "bfo", label: "BFO", exchanges: ["BFO"], hint: "BSE futures & options, e.g. SENSEX" },
  { id: "mcx", label: "MCX", exchanges: ["MCX"], hint: "commodities, e.g. GOLD, CRUDEOIL" },
  { id: "indices", label: "Indices", exchanges: ["INDICES"], hint: "indices, e.g. NIFTY BANK" },
] as const;

export type SearchSegment = (typeof SEARCH_SEGMENTS)[number];

/** Rows ranked for a search, however few are returned. */
const SEARCH_WINDOW = 30;

/**
 * Search instruments by symbol prefix, within one of the popup's segments.
 *
 * Prefix rather than contains, and this is not a detail: `symbol like "%sbin%"`
 * OR'd across three columns takes 11 seconds against the full contract master,
 * because a leading wildcard cannot use an index. `symbol like "sbin%"` answers
 * the same query in under half a second, which is the difference between a
 * search box that works while you type and one that times out.
 *
 * Contract Master's `order` puts indices and the cash market ahead of
 * derivatives, so under "All" typing "sbin" finds SBIN-EQ before the first
 * strike of its options chain. Within a derivatives exchange every row shares
 * one `order`, so they're sorted the way a trader scans a chain: futures before
 * options, nearest expiry first, strikes in order.
 *
 * The cost is that only the trading symbol is matched - typing a company name
 * finds nothing. Contract Master has no company names to match anyway; that
 * belongs to whatever eventually owns the editorial data.
 */
export async function searchContracts(
  term: string,
  limit = 5,
  segment: SearchSegment = SEARCH_SEGMENTS[0],
): Promise<Contract[]> {
  const results = await query(
    new URLSearchParams({
      fields: FIELDS,
      filters: JSON.stringify([
        ["symbol", "like", `${escapeLike(term)}%`],
        ["exchange", "in", segment.exchanges],
      ]),
      // A wider window than is returned, so the sort below can bring the
      // exact symbol forward: "gold" wants GOLD's futures, and the database
      // alone would list GOLDGUINEA's because it expires first.
      limit_page_length: String(Math.max(limit, SEARCH_WINDOW)),
      order_by: "order asc, instrument_type asc, expiry_date asc, strike_price asc",
    }),
  );
  // Stable, so contracts of one symbol keep the expiry order above.
  const top = results.sort(byOrderThenSymbol).slice(0, limit);
  // A result is usually clicked next, and its page starts with this very
  // lookup - kept now, the page skips Frappe altogether.
  await Promise.all(top.map((contract) => remember(contract)));
  return top;
}

/* ---------------------------------------------------------------------------
   Sitemap enumeration
   ------------------------------------------------------------------------ */

/**
 * The exchanges whose /stocks pages are advertised in the sitemap.
 *
 * Cash market and indices only. NFO, BFO and MCX are deliberately left out:
 * they are 136,000 of the 159,000 rows in Contract Master, and every one is a
 * dated contract that stops existing at expiry - a sitemap full of
 * "NIFTY 25SEP 24000 CE" would be mostly dead links within the week. Same
 * reasoning as the seminars note in sitemap.xml.ts: those pages stay
 * reachable, they just are not advertised.
 */
export const SITEMAP_EXCHANGES = ["INDICES", "NSE", "BSE"] as const;

/**
 * NSE series kept in the sitemap, read off the end of `trading_symbol`.
 *
 * Contract Master's NSE rows are mostly NOT shares: of 9,748, some 4,300 are
 * state government securities (-SG), 1,200 are debentures (-N0 through -NZ,
 * -Y*, -Z*) and another 300 are treasury bills and sovereign gold bonds
 * (-TB, -GS, -GB, -SF). Those are tradeable instruments with pages, but nobody
 * searches for "1003SCL31A", and 6,000 such URLs is thin content that drags on
 * the domain rather than earning anything.
 *
 * EQ/BE/BZ are the equity segments, SM/ST the SME board, and IV/RR the InvITs
 * and REITs (Embassy, Bagmane, IndiGrid) - listed, named, and searched for.
 */
const NSE_EQUITY_SERIES = new Set(["EQ", "BE", "BZ", "SM", "ST", "IV", "RR"]);

/**
 * BSE carries no series suffix at all, so its debt is spotted by the shape of
 * the symbol: a bond code either starts with the coupon ("001HCCL29",
 * "0795GOI32") or ends in a maturity ("ABCL26", "ABHF090326"). Roughly 7,000
 * of BSE's 13,045 rows match.
 *
 * A symbol that is listed as equity on NSE is kept regardless - that rescues
 * the ETFs, whose names legitimately end in digits ("ICICIB22", "HDFCNIF100").
 */
const looksLikeDebtCode = (symbol: string) => /^\d/.test(symbol) || /\d{2,}$/.test(symbol);

/** The series at the end of "HDFCBANK-EQ"; "" when the symbol carries none. */
function seriesOf(tradingSymbol: string): string {
  return tradingSymbol.match(/-([A-Z0-9]+)$/)?.[1] ?? "";
}

/** Frappe caps a single response; the list is walked in pages this size. */
const SITEMAP_FETCH_PAGE = 5000;

/**
 * URLs per sitemap file. The protocol allows 50,000, but smaller files keep
 * each SSR response quick and let a crawler pick changes up incrementally.
 */
export const SITEMAP_CHUNK_SIZE = 5000;

const SITEMAP_TTL_MS = 60 * 60 * 1000;
let sitemapCache: { at: number; slugs: string[] } | null = null;

/**
 * Every distinct /stocks/<slug> address worth advertising, sorted.
 *
 * Walks all 22,885 cash-market rows and keeps the ~9,600 that are actually
 * equity (see the series notes above), which dedupe to roughly 7,500 addresses.
 * This is the one query on the site that reads the whole contract master, so
 * the result is held per isolate for an hour and the responses built from it
 * are cached for the same - a crawler working through the chunks pays for the
 * walk once rather than once per file.
 */
export async function listSitemapSlugs(): Promise<string[]> {
  if (sitemapCache && Date.now() - sitemapCache.at < SITEMAP_TTL_MS) return sitemapCache.slugs;

  /** Walks one exchange's rows, a page at a time. Offsets must be sequential. */
  async function walk(exchange: string): Promise<Contract[]> {
    const rows: Contract[] = [];

    for (let start = 0; ; start += SITEMAP_FETCH_PAGE) {
      const page = await query(
        new URLSearchParams({
          fields: FIELDS,
          filters: JSON.stringify([["exchange", "=", exchange]]),
          limit_page_length: String(SITEMAP_FETCH_PAGE),
          limit_start: String(start),
          order_by: "symbol asc",
        }),
      );

      rows.push(...page);

      // A short page is the last one. A failed query returns [] and also ends
      // the walk, which yields a partial sitemap rather than none at all.
      if (page.length < SITEMAP_FETCH_PAGE) break;
    }

    return rows;
  }

  // The three exchanges run together: pages within one must be sequential
  // because the offset depends on the last response, but the exchanges do not
  // depend on each other. Six round trips become three, which matters here -
  // this is the slowest request on the site.
  const [indices, nse, bse] = await Promise.all(SITEMAP_EXCHANGES.map(walk));

  // Shares, SME, InvITs and REITs. Everything else on the NSE list is debt.
  const nseEquity = nse.filter((contract) => NSE_EQUITY_SERIES.has(seriesOf(contract.tradingSymbol)));
  const nseEquitySymbols = new Set(nseEquity.map((contract) => contract.symbol));

  const bseEquity = bse.filter(
    (contract) => nseEquitySymbols.has(contract.symbol) || !looksLikeDebtCode(contract.symbol),
  );

  const slugs = new Set<string>();
  for (const rows of [indices, nseEquity, bseEquity]) {
    // Two rows can resolve to one address - a company's NSE row and a second
    // share class that slugifies the same way - and one address is one page.
    for (const contract of rows) if (contract.slug) slugs.add(contract.slug);
  }

  const sorted = [...slugs].sort();
  sitemapCache = { at: Date.now(), slugs: sorted };
  return sorted;
}

/**
 * slug -> contract, kept for an hour. Every stock page starts with this lookup
 * and nothing else can begin until it answers - over half a second from Frappe
 * - so it is kept twice over: in this isolate, and in the data centre's shared
 * cache for every other isolate (see edge-cache.ts). The search endpoint keeps
 * the contracts it returns the same way, so clicking a result skips Frappe.
 *
 * Contract Master is regenerated daily, but a listed share's token doesn't
 * change with it, and a derivative's lasts until expiry. Misses aren't kept: a
 * new listing should appear as soon as Frappe has it.
 */
const CONTRACT_TTL_MS = 60 * 60 * 1000;
/** Enough for every page anyone actually visits, while a crawler walking the option chains can't grow it without bound. */
const CONTRACT_CACHE_LIMIT = 2000;
const contractCache = new Map<string, { at: number; contract: Contract }>();

function keepInIsolate(slug: string, contract: Contract) {
  contractCache.delete(slug);
  contractCache.set(slug, { at: Date.now(), contract });
  // A Map iterates in insertion order, so the first key is the stalest.
  if (contractCache.size > CONTRACT_CACHE_LIMIT) contractCache.delete(contractCache.keys().next().value!);
}

/**
 * Keep a contract under the address it was asked for and its canonical one -
 * so an old address's redirect lands on a lookup already made - in both caches.
 */
async function remember(contract: Contract, ...asked: string[]) {
  const slugs = [...new Set([...asked, contract.slug])];
  for (const slug of slugs) keepInIsolate(slug, contract);
  await Promise.all(slugs.map((slug) => edgePut(`contract:${slug}`, contract, CONTRACT_TTL_MS / 1000)));
}

export async function findContractBySlug(slug: string): Promise<Contract | null> {
  const hit = contractCache.get(slug);
  if (hit && Date.now() - hit.at < CONTRACT_TTL_MS) return hit.contract;

  const shared = await edgeGet<Contract>(`contract:${slug}`);
  if (shared) {
    keepInIsolate(slug, shared);
    return shared;
  }

  const contract = await lookupContract(slug);
  if (contract) await remember(contract, slug);
  return contract;
}

/**
 * Resolve a URL slug back to an instrument.
 *
 * Slugification is lossy - "Nifty 50" and "SBIN-EQ" both collapse their
 * separator to a hyphen - so the name is reconstructed both ways and looked up
 * directly. That matters for more than tidiness: a wildcard scan for
 * "nifty-50" matches every "NIFTY 13th OCT 18450 CE" in the options chain, and
 * the row actually wanted can fall outside the candidate window entirely.
 *
 * The scan is kept as a fallback for names that mix both separators, with the
 * exact match made on the slug itself. Where several exchanges list the same
 * name, the cash market wins.
 *
 * A company-name address is looked up by exchange and symbol instead. Any
 * other address a share can still be reached by - its old "reliance-eq", its
 * bare BSE symbol - resolves by name as before, and the page redirects to the
 * contract's canonical `slug`.
 */
async function lookupContract(slug: string): Promise<Contract | null> {
  const listing = companyListing(slug);
  if (listing) {
    const rows = await query(
      new URLSearchParams({
        fields: FIELDS,
        filters: JSON.stringify([
          ["exchange", "=", listing.exchange],
          ["symbol", "=", listing.symbol],
        ]),
        limit_page_length: "20",
      }),
    );
    // Should NSE ever carry a symbol in two series, the ordinary shares win.
    const own = rows
      .filter((contract) => contract.slug === slug)
      .sort((a, b) => Number(!a.name.endsWith("-EQ")) - Number(!b.name.endsWith("-EQ")));
    if (own.length > 0) return own[0];
  }

  const variants = [slug.replace(/-/g, " "), slug];

  const direct = await query(
    new URLSearchParams({
      fields: FIELDS,
      filters: JSON.stringify([["formatted_ins_name", "in", variants]]),
      limit_page_length: "20",
    }),
  );

  // Matched on the name's own slug, not the canonical one: this is how an old
  // address finds the contract it now redirects to.
  const exactDirect = direct.filter((contract) => slugify(contract.name) === slug);
  if (exactDirect.length > 0) return exactDirect.sort(byOrderThenSymbol)[0];

  const candidates = await query(
    new URLSearchParams({
      fields: FIELDS,
      filters: JSON.stringify([["formatted_ins_name", "like", `${slug.replace(/-/g, "%")}%`]]),
      limit_page_length: "200",
    }),
  );

  const exact = candidates.filter((contract) => slugify(contract.name) === slug);
  if (exact.length === 0) return null;
  return exact.sort(byOrderThenSymbol)[0];
}
