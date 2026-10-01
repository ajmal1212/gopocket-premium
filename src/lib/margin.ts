import { getFrappeUrl, getFrappeToken } from "@/lib/frappe";

/**
 * Margin calculator backend: derivative lookups in Contract Master and the
 * SPAN margin call (`gopocket.api.get_span_margin`).
 *
 * Both run server side only - the Frappe token is a secret - and are reached
 * through /api/margin-contracts and /api/span-margin.
 */

const TIMEOUT_MS = 8000;

/**
 * Segments the SPAN API prices. The cash market has no SPAN margin. NCOM is
 * not here because Contract Master carries no NCOM contracts yet, and the
 * margin API looks every position up there first.
 */
export const MARGIN_EXCHANGES = ["NFO", "BFO", "MCX"] as const;
export type MarginExchange = (typeof MARGIN_EXCHANGES)[number];

/** "M" is NRML (carry forward), "I" is MIS (intraday). */
export const MARGIN_PRODUCTS = ["M", "I"] as const;
export type MarginProduct = (typeof MARGIN_PRODUCTS)[number];

/** Futures or options - the calculator's second step, after the exchange. */
export const CONTRACT_KINDS = ["FUT", "OPT"] as const;
export type ContractKind = (typeof CONTRACT_KINDS)[number];

/**
 * Contract Master's `instrument_type` for each kind. The codes are
 * exchange-native: NFO and MCX use FUTIDX / OPTSTK / OPTFUT and so on, BFO the
 * short IF / SF / IO / SO. One list per kind covers all three exchanges,
 * because the `exchange` filter beside it keeps them apart.
 */
const INSTRUMENT_TYPES: Record<ContractKind, string[]> = {
  FUT: ["FUTIDX", "FUTSTK", "FUTCOM", "IF", "SF"],
  OPT: ["OPTIDX", "OPTSTK", "OPTFUT", "IO", "SO"],
};

/** One row of the Symbol - Expiry field: an underlying and one of its expiries. */
export interface UnderlyingExpiry {
  symbol: string;
  /** ISO date. */
  expiry: string;
}

export interface DerivativeContract {
  /** Exchange-native symbol, e.g. "NIFTY06OCT26P25000" - what the margin API is keyed by. */
  tradingSymbol: string;
  /** Display name, e.g. "NIFTY 6th OCT 25000 PE". */
  name: string;
  exchange: MarginExchange;
  lotSize: number;
  /** null on a future. */
  optionType: "CE" | "PE" | null;
  strike: number | null;
}

interface ContractRow {
  trading_symbol?: string;
  formatted_ins_name?: string;
  lot_size?: string | number;
  option_type?: string;
  strike_price?: string | number;
  symbol?: string;
  expiry_date?: string;
}

/** `%` and `_` are LIKE wildcards; a stray one from the search box must match literally. */
const escapeLike = (value: string) => value.replace(/[%_]/g, "\\$&");

/** A lookup that fails returns nothing: an empty dropdown beats a broken form. */
async function contractRows(params: URLSearchParams): Promise<ContractRow[]> {
  try {
    const response = await fetch(`${getFrappeUrl()}/api/resource/Contract%20Master?${params}`, {
      headers: { Authorization: `token ${getFrappeToken()}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return [];
    const body = (await response.json()) as { data?: ContractRow[] };
    return body.data || [];
  } catch {
    return [];
  }
}

/**
 * The Symbol - Expiry field: every expiry of the underlyings starting with
 * `term`, for one exchange and kind. Grouped in the database, so NIFTY's
 * thousands of option rows come back as its dozen expiries.
 *
 * A prefix match on `symbol`, never a leading wildcard - see searchContracts
 * in contracts.ts for what that costs. Sorted by symbol, so typing "NIFTY"
 * lists NIFTY's own expiries before NIFTYNXT50's.
 */
export async function searchUnderlyings(
  term: string,
  exchange: MarginExchange,
  kind: ContractKind,
  limit = 30,
): Promise<UnderlyingExpiry[]> {
  const rows = await contractRows(
    new URLSearchParams({
      fields: JSON.stringify(["symbol", "expiry_date"]),
      filters: JSON.stringify([
        ["exchange", "=", exchange],
        ["instrument_type", "in", INSTRUMENT_TYPES[kind]],
        ["symbol", "like", `${escapeLike(term.toUpperCase())}%`],
      ]),
      group_by: "symbol, expiry_date",
      order_by: "symbol asc, expiry_date asc",
      limit_page_length: String(limit),
    }),
  );
  return rows
    .filter((row) => row.symbol && row.expiry_date)
    .map((row) => ({ symbol: row.symbol!, expiry: row.expiry_date! }));
}

/**
 * One MCX lot, in the quantity unit the SPAN margin API expects.
 *
 * Deliberately separate from `commodityLotSizes` in brokerage.ts. That table
 * turns a quoted price into a contract value (gold is quoted per 10 g, so
 * GOLDM is 10); this one is what the margin API counts (GOLDM is 100). The
 * units differ by commodity - tonnes for base metals, grams for GOLDM - so
 * neither can be derived from the other.
 */
const MCX_MARGIN_LOT_SIZES: Record<string, number> = {
  ALUMINI: 1,
  ALUMINIUM: 5,
  CARDAMOM: 100,
  COPPER: 2500,
  COTTON: 25,
  COTTONOIL: 5,
  CRUDEOIL: 100,
  CRUDEOILM: 10,
  ELECDMBL: 50,
  GOLD: 1,
  GOLDGUINEA: 8,
  GOLDM: 100,
  GOLDPETAL: 1,
  GOLDTEN: 10,
  KAPAS: 4,
  LEAD: 5,
  LEADMINI: 1,
  MCXBULLDEX: 30,
  MCXMETLDEX: 40,
  MENTHAOIL: 360,
  NATGASMINI: 250,
  NATURALGAS: 1250,
  NICKEL: 250,
  SILVER: 30,
  SILVER100: 100,
  SILVERM: 5,
  SILVERMIC: 1,
  ZINC: 5,
  ZINCMINI: 1,
};

/** Upper bound on one expiry's contracts - a busy index chain runs to a few hundred strikes a side. */
const CHAIN_LIMIT = 3000;

/**
 * Every contract of one underlying and expiry: the single future, or the full
 * option chain, both sides, strikes ascending. The page fills its Option type
 * and Strike fields from this one response.
 *
 * MCX lot sizes come from MCX_MARGIN_LOT_SIZES below, not Contract Master,
 * which lists every MCX contract with a lot size of 1. A commodity missing
 * from the table falls back to Contract Master's figure.
 */
export async function listContracts(
  exchange: MarginExchange,
  kind: ContractKind,
  symbol: string,
  expiry: string,
): Promise<DerivativeContract[]> {
  const rows = await contractRows(
    new URLSearchParams({
      fields: JSON.stringify(["trading_symbol", "formatted_ins_name", "lot_size", "option_type", "strike_price"]),
      filters: JSON.stringify([
        ["exchange", "=", exchange],
        ["instrument_type", "in", INSTRUMENT_TYPES[kind]],
        ["symbol", "=", symbol],
        ["expiry_date", "=", expiry],
      ]),
      limit_page_length: String(CHAIN_LIMIT),
    }),
  );

  const lotSize = (row: ContractRow) => (exchange === "MCX" && MCX_MARGIN_LOT_SIZES[symbol]) || Number(row.lot_size);

  return (
    rows
      .filter((row) => row.trading_symbol && lotSize(row) > 0)
      .map((row) => {
        const optionType: DerivativeContract["optionType"] =
          row.option_type === "CE" || row.option_type === "PE" ? row.option_type : null;
        return {
          tradingSymbol: row.trading_symbol!,
          name: row.formatted_ins_name || row.trading_symbol!,
          exchange,
          lotSize: lotSize(row),
          optionType,
          strike: optionType ? Number(row.strike_price) : null,
        };
      })
      // Numerically here: `strike_price` is a text column, so the database
      // would put 10000 before 9500.
      .sort((a, b) => (a.strike ?? 0) - (b.strike ?? 0))
  );
}

export interface MarginPosition {
  trading_symbol: string;
  exchange: MarginExchange;
  side: "buy" | "sell";
  quantity: number;
}

export interface MarginFigures {
  span: number;
  exposure: number;
  total: number;
}

export interface MarginResult extends MarginFigures {
  /** Each position priced on its own, in request order. */
  legs: MarginFigures[];
  /** What hedging saves: the margin without offsets minus the margin with them. */
  benefit: number;
}

/**
 * The API prices a basket twice. `span` / `expo` / `total_margin` treat every
 * position as if it stood alone; the `_trade` fields are what the basket
 * actually needs once hedges offset each other - a bought call against a sold
 * one, a future against an option. So the `_trade` figures are the margin
 * required, and the gap between the two totals is the benefit.
 */
interface SpanMessage {
  status?: string;
  span_trade?: number;
  expo_trade?: number;
  total_margin?: number;
  total_margin_trade?: number;
}

interface SpanResponse {
  message?: SpanMessage;
  _server_messages?: string;
  exception?: string;
}

/** Frappe's `_server_messages` is a JSON array of JSON strings, each with a `message`. */
function frappeError(body: SpanResponse): string {
  try {
    const messages = JSON.parse(body._server_messages || "[]") as string[];
    const first = messages.map((m) => (JSON.parse(m) as { message?: string }).message).find(Boolean);
    if (first) return first;
  } catch {
    // Fall through to the generic message.
  }
  return "Margin could not be calculated for these positions.";
}

async function spanMargin(product: MarginProduct, positions: MarginPosition[]): Promise<SpanMessage> {
  const response = await fetch(`${getFrappeUrl()}/api/method/gopocket.api.get_span_margin`, {
    method: "POST",
    headers: { Authorization: `token ${getFrappeToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ product, positions }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = (await response.json().catch(() => ({}))) as SpanResponse;
  const result = body.message;
  if (!response.ok || result?.status !== "success") throw new Error(frappeError(body));
  return result;
}

const required = (result: SpanMessage): MarginFigures => ({
  span: result.span_trade ?? 0,
  exposure: result.expo_trade ?? 0,
  total: result.total_margin_trade ?? 0,
});

/**
 * The basket, plus each leg alone for the basket table's per-position margin.
 * The benefit comes from the basket call itself; the legs are display only.
 */
export async function calculateMargin(product: MarginProduct, positions: MarginPosition[]): Promise<MarginResult> {
  const [basket, ...legs] = await Promise.all([
    spanMargin(product, positions),
    // One position is its own leg - no second call needed.
    ...(positions.length > 1 ? positions.map((position) => spanMargin(product, [position])) : []),
  ]);
  const gross = basket.total_margin ?? 0;
  const net = basket.total_margin_trade ?? 0;
  return {
    ...required(basket),
    legs: (legs.length ? legs : [basket]).map(required),
    benefit: Math.max(0, Math.round((gross - net) * 100) / 100),
  };
}
