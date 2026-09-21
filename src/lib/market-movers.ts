import { edgeGet, edgePut } from "@/lib/edge-cache";
import { getFrappeToken, getFrappeUrl } from "@/lib/frappe";
import { nseCompany } from "@/lib/contracts";

/**
 * NSE's top gainers and losers, relayed by Frappe.
 *
 * Both methods return the same shape: the exchange's own groups (Nifty 50,
 * Bank Nifty, F&O securities, ...), each with up to twenty rows and the time
 * NSE took the snapshot. The token is required - the methods 403 without it -
 * so this is only ever read while rendering, never from the browser.
 */

export type MoverKind = "gainers" | "losers";

const METHODS: Record<MoverKind, string> = {
  gainers: "gopocket.api.top_gainers",
  losers: "gopocket.api.top_losers",
};

const TIMEOUT_MS = 5000;
// NSE refreshes the list every minute or so during the session.
const TTL_MS = 60 * 1000;

/**
 * The groups in the order the tabs show them, keyed by the id NSE uses. The
 * URL carries the short `param`, so an address reads ?index=bank-nifty rather
 * than ?index=BANKNIFTY.
 */
export const MOVER_GROUPS = [
  { id: "NIFTY", param: "nifty-50", label: "Nifty 50" },
  { id: "BANKNIFTY", param: "bank-nifty", label: "Bank Nifty" },
  { id: "NIFTYNEXT50", param: "nifty-next-50", label: "Nifty Next 50" },
  { id: "FOSec", param: "fno", label: "F&O stocks" },
  { id: "SecGtr20", param: "above-20", label: "Above ₹20" },
  { id: "SecLwr20", param: "below-20", label: "Below ₹20" },
  { id: "allSec", param: "all", label: "All stocks" },
] as const;

export type MoverGroup = (typeof MOVER_GROUPS)[number];

export const groupByParam = (param: string | null): MoverGroup =>
  MOVER_GROUPS.find((group) => group.param === param) ?? MOVER_GROUPS[0];

interface RawRow {
  symbol?: string;
  series?: string;
  ltp?: number;
  prev_price?: number;
  perChange?: number;
}

interface RawGroup {
  data?: RawRow[];
  timestamp?: string;
}

export interface Mover {
  symbol: string;
  /** Company name where NSE's list has one; the symbol otherwise. */
  name: string;
  /** The /stocks address, or null when the symbol has no page. */
  href: string | null;
  ltp: number;
  change: number;
  percent: number;
  prevClose: number;
}

export interface MoverList {
  rows: Mover[];
  /** NSE's snapshot time, as sent: "21-Sep-2026 11:48:28". */
  asOf: string | null;
}

const finite = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

function toMover(row: RawRow): Mover | null {
  if (!row.symbol || typeof row.ltp !== "number") return null;
  const company = nseCompany(row.symbol);
  const prevClose = finite(row.prev_price);
  /*
   * nse-companies.json holds names as headlines write them, with "Limited"
   * dropped - so ITC, NTPC and ETERNAL are stored as their own symbol, and the
   * table's name line would be an empty repeat. Every company on NSE's equity
   * list is a limited company, so "ITC Ltd" is both accurate and distinct.
   */
  const listed = company?.name;
  const name = listed && listed.toUpperCase() === row.symbol.toUpperCase() ? `${listed} Ltd` : listed;
  return {
    symbol: row.symbol,
    name: name ?? row.symbol,
    href: company ? `/stocks/${company.slug}` : null,
    ltp: row.ltp,
    change: prevClose ? row.ltp - prevClose : 0,
    percent: finite(row.perChange),
    prevClose,
  };
}

type Groups = Partial<Record<MoverGroup["id"], MoverList>>;

async function readMovers(kind: MoverKind): Promise<Groups | null> {
  try {
    const response = await fetch(`${getFrappeUrl()}/api/method/${METHODS[kind]}`, {
      headers: { Authorization: `token ${getFrappeToken()}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as { message?: { data?: Record<string, RawGroup> } };
    const data = body.message?.data;
    if (!data) return null;

    const groups: Groups = {};
    for (const { id } of MOVER_GROUPS) {
      const group = data[id];
      if (!group?.data) continue;
      groups[id] = {
        rows: group.data.map(toMover).filter((row): row is Mover => row !== null),
        asOf: group.timestamp ?? null,
      };
    }
    return groups;
  } catch (error) {
    console.error(`Top ${kind} lookup failed:`, error);
    return null;
  }
}

const cache = new Map<MoverKind, { at: number; value: Groups }>();

/** Every group for one side of the market. Null when Frappe couldn't be asked. */
export async function fetchMovers(kind: MoverKind): Promise<Groups | null> {
  const kept = cache.get(kind);
  if (kept && Date.now() - kept.at < TTL_MS) return kept.value;

  const shared = await edgeGet<Groups>(`movers:${kind}`);
  if (shared) {
    cache.set(kind, { at: Date.now(), value: shared });
    return shared;
  }

  const value = await readMovers(kind);
  if (!value) return kept?.value ?? null;
  cache.set(kind, { at: Date.now(), value });
  await edgePut(`movers:${kind}`, value, TTL_MS / 1000);
  return value;
}
