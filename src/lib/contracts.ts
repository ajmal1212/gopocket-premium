import { getFrappeUrl, getFrappeToken } from "@/lib/frappe";

/**
 * Contract Master lookups.
 *
 * Every instrument the feed carries lives in this doctype, keyed by
 * `EXCHANGE|token`. `formatted_ins_name` is the human-readable name - "SBIN-EQ",
 * "Nifty 50", "RELIANCE 29th SEP 700 CE" - and doubles as the URL slug, so a
 * page exists for anything that can be searched.
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
    slug: slugify(name),
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
 * Search instruments by symbol prefix.
 *
 * Prefix rather than contains, and this is not a detail: `symbol like "%sbin%"`
 * OR'd across three columns takes 11 seconds against the full contract master,
 * because a leading wildcard cannot use an index. `symbol like "sbin%"` answers
 * the same query in under half a second, which is the difference between a
 * search box that works while you type and one that times out.
 *
 * Restricted to indices and the cash segments by default for the same reason it
 * reads better: "sbin" should find SBIN-EQ, not the first thirty strikes of its
 * options chain. Pass `derivatives` to include NFO and BFO.
 *
 * The cost is that only the trading symbol is matched - typing a company name
 * finds nothing. Contract Master has no company names to match anyway; that
 * belongs to whatever eventually owns the editorial data.
 */
export async function searchContracts(term: string, limit = 30, derivatives = false): Promise<Contract[]> {
  const exchanges = derivatives ? ["INDICES", "NSE", "BSE", "NFO", "BFO"] : ["INDICES", "NSE", "BSE"];

  const results = await query(
    new URLSearchParams({
      fields: FIELDS,
      filters: JSON.stringify([
        ["symbol", "like", `${escapeLike(term)}%`],
        ["exchange", "in", exchanges],
      ]),
      limit_page_length: String(limit),
      order_by: "order asc",
    }),
  );
  return results.sort(byOrderThenSymbol);
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
 */
export async function findContractBySlug(slug: string): Promise<Contract | null> {
  const variants = [slug.replace(/-/g, " "), slug];

  const direct = await query(
    new URLSearchParams({
      fields: FIELDS,
      filters: JSON.stringify([["formatted_ins_name", "in", variants]]),
      limit_page_length: "20",
    }),
  );

  const exactDirect = direct.filter((contract) => contract.slug === slug);
  if (exactDirect.length > 0) return exactDirect.sort(byOrderThenSymbol)[0];

  const candidates = await query(
    new URLSearchParams({
      fields: FIELDS,
      filters: JSON.stringify([["formatted_ins_name", "like", `${slug.replace(/-/g, "%")}%`]]),
      limit_page_length: "200",
    }),
  );

  const exact = candidates.filter((contract) => contract.slug === slug);
  if (exact.length === 0) return null;
  return exact.sort(byOrderThenSymbol)[0];
}
