import { edgeGet, edgePut } from "@/lib/edge-cache";
import { getFrappeToken, getFrappeUrl } from "@/lib/frappe";

/**
 * A company's reported revenue and profit, by quarter and by financial year,
 * from Frappe's gopocket.api.get_stocks_financial_statement. Figures are in
 * ₹ crore, as the endpoint gives them.
 *
 * Plain fetch only: the Frappe SDK fails on Workers (see lib/shareholding.ts),
 * and this is only ever read from a server island, where the SDK's one upside -
 * working under `astro dev` - buys nothing that fetch doesn't.
 */

const METHOD = "gopocket.api.get_stocks_financial_statement";
const TIMEOUT_MS = 5000;
/** Results change once a quarter. A symbol with no record is asked about again sooner. */
const TTL_MS = 6 * 60 * 60 * 1000;
const MISS_TTL_MS = 30 * 60 * 1000;

interface Statement {
  title?: string;
  yearly?: Record<string, number>;
  quarterly?: Record<string, number>;
  cagr?: Record<string, number>;
}

interface Message {
  status?: string;
  financialStatement?: Statement[];
  financialStatementV2?: { CONSOLIDATED?: Statement[]; STANDALONE?: Statement[] };
}

export interface FinancialPeriod {
  /** As the endpoint labels it: "Jun '26" for a quarter, "2026" for a year. */
  label: string;
  revenue: number | null;
  profit: number | null;
}

export interface Growth {
  /** "1Y (TTM)", "3Y CAGR". */
  label: string;
  /** A fraction: 0.18 is 18%. */
  value: number;
}

export interface Financials {
  basis: "Consolidated" | "Standalone";
  /** Oldest first. */
  quarterly: FinancialPeriod[];
  yearly: FinancialPeriod[];
  revenueGrowth: Growth[];
  profitGrowth: Growth[];
}

/**
 * The growth figures the endpoint may send, in the order they're shown. Only
 * the one-year figure is sent today; a key not listed here is left out rather
 * than shown under a guessed name.
 */
const GROWTH_LABELS: [key: string, label: string][] = [
  ["oneYearTtm", "1Y (TTM)"],
  ["threeYearCagr", "3Y CAGR"],
  ["threeYear", "3Y CAGR"],
  ["fiveYearCagr", "5Y CAGR"],
  ["fiveYear", "5Y CAGR"],
];

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function periods(revenue: Record<string, number> = {}, profit: Record<string, number> = {}): FinancialPeriod[] {
  // Keys arrive oldest first. Years are integer-like, which JavaScript orders
  // numerically anyway.
  const labels = [...new Set([...Object.keys(revenue), ...Object.keys(profit)])];
  return labels
    .map((label) => ({
      label,
      revenue: finite(revenue[label]) ? revenue[label] : null,
      profit: finite(profit[label]) ? profit[label] : null,
    }))
    .filter((period) => period.revenue !== null || period.profit !== null);
}

function growth(cagr: Record<string, number> = {}): Growth[] {
  const seen = new Set<string>();
  const rows: Growth[] = [];
  for (const [key, label] of GROWTH_LABELS) {
    if (!finite(cagr[key]) || seen.has(label)) continue;
    seen.add(label);
    rows.push({ label, value: cagr[key] });
  }
  return rows;
}

/** Consolidated where the company reports it - it's the figure analysts quote - else standalone. */
function summarise(message: Message): Financials | null {
  const v2 = message.financialStatementV2;
  const [basis, statements]: [Financials["basis"], Statement[] | undefined] = v2?.CONSOLIDATED?.length
    ? ["Consolidated", v2.CONSOLIDATED]
    : v2?.STANDALONE?.length
      ? ["Standalone", v2.STANDALONE]
      : ["Consolidated", message.financialStatement];

  const find = (title: string) => statements?.find((statement) => statement.title?.toLowerCase() === title);
  const revenue = find("revenue");
  const profit = find("profit");

  const result: Financials = {
    basis,
    quarterly: periods(revenue?.quarterly, profit?.quarterly),
    yearly: periods(revenue?.yearly, profit?.yearly),
    revenueGrowth: growth(revenue?.cagr),
    profitGrowth: growth(profit?.cagr),
  };
  return result.quarterly.length > 0 || result.yearly.length > 0 ? result : null;
}

/** Null when Frappe has no record for the symbol; undefined when it couldn't be asked. */
async function readFinancials(symbol: string): Promise<Financials | null | undefined> {
  try {
    const response = await fetch(`${getFrappeUrl()}/api/method/${METHOD}?symbol=${encodeURIComponent(symbol)}`, {
      headers: { Authorization: `token ${getFrappeToken()}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // 417 is Frappe's "no record for this symbol". A 5xx is Frappe having
    // trouble, which shouldn't be remembered as "no financials".
    if (response.status >= 400 && response.status < 500) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as { message?: Message };
    // An unknown symbol usually comes back as a 200 with `status: "not_found"`
    // and empty statements, rather than as the 417 above.
    if (!body.message || body.message.status === "not_found") return null;
    return summarise(body.message);
  } catch (error) {
    console.error(`Financial statement lookup failed for ${symbol}:`, error);
    return undefined;
  }
}

const cache = new Map<string, { at: number; value: Financials | null }>();

export async function fetchFinancials(symbol: string): Promise<Financials | null> {
  const kept = cache.get(symbol);
  if (kept && Date.now() - kept.at < (kept.value ? TTL_MS : MISS_TTL_MS)) return kept.value;

  const shared = await edgeGet<{ value: Financials | null }>(`financials:${symbol}`);
  if (shared) {
    cache.set(symbol, { at: Date.now(), value: shared.value });
    return shared.value;
  }

  const value = await readFinancials(symbol);
  if (value === undefined) return null;
  cache.set(symbol, { at: Date.now(), value });
  await edgePut(`financials:${symbol}`, { value }, (value ? TTL_MS : MISS_TTL_MS) / 1000);
  return value;
}
