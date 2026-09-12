import NSE_COMPANIES from "@/data/nse-companies.json";
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

/** The listing a company-name address stands for, or null for any other address. */
function companyListing(slug: string): { exchange: "NSE" | "BSE"; symbol: string } | null {
  const { symbolBySlug } = companies();
  const nse = symbolBySlug.get(slug);
  if (nse) return { exchange: "NSE", symbol: nse };
  const bse = slug.endsWith(BSE_SUFFIX) ? symbolBySlug.get(slug.slice(0, -BSE_SUFFIX.length)) : undefined;
  return bse ? { exchange: "BSE", symbol: bse } : null;
}

const toContract = (row: ContractRow): Contract | null => {
  const name = row.formatted_ins_name || row.trading_symbol || row.symbol || "";
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
  return results.sort(byOrderThenSymbol).slice(0, limit);
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
export async function findContractBySlug(slug: string): Promise<Contract | null> {
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
