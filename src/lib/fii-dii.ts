import { swr } from "@/lib/edge-cache";
import { getFrappeToken, getFrappeUrl } from "@/lib/frappe";

/**
 * FII and DII cash-market activity, relayed by Frappe from the exchanges'
 * provisional figures.
 *
 * One method serves every view: `period` picks the bucket (a row per day, ISO
 * week or month) and `from_date`/`to_date` the window. Without dates the method
 * answers the last month only, which suits the daily view but would leave the
 * monthly one with two bars - so the longer periods ask for a longer window
 * explicitly (see WINDOW_MONTHS).
 */

const METHOD = "gopocket.api.get_fii_dii";
const TIMEOUT_MS = 6000;

export type FiiDiiPeriod = "daily" | "weekly" | "monthly" | "custom";

export const PERIODS: { id: FiiDiiPeriod; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "custom", label: "Custom" },
];

/** How far back each view reaches when no dates are given. Custom defaults to the daily window. */
const WINDOW_MONTHS: Record<FiiDiiPeriod, number> = { daily: 1, weekly: 3, monthly: 12, custom: 1 };

/** A custom range is plotted a bar per day, so it is capped to keep the bars readable. */
export const MAX_CUSTOM_DAYS = 366;

export interface FiiDiiRow {
  /** First and last trading day the row covers, "YYYY-MM-DD". Equal on a daily row. */
  from: string;
  to: string;
  tradingDays: number;
  fiiBuy: number;
  fiiSell: number;
  fiiNet: number;
  diiBuy: number;
  diiSell: number;
  diiNet: number;
}

interface RawRow {
  from_date?: string;
  to_date?: string;
  trading_days?: number;
  fii_gross_buy?: number;
  fii_gross_sell?: number;
  fii_net_buy_sell?: number;
  dii_gross_buy?: number;
  dii_gross_sell?: number;
  dii_net_buy_sell?: number;
}

const num = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

function toRow(raw: RawRow): FiiDiiRow | null {
  if (!raw.from_date || !raw.to_date) return null;
  return {
    from: raw.from_date,
    to: raw.to_date,
    tradingDays: num(raw.trading_days),
    fiiBuy: num(raw.fii_gross_buy),
    fiiSell: num(raw.fii_gross_sell),
    fiiNet: num(raw.fii_net_buy_sell),
    diiBuy: num(raw.dii_gross_buy),
    diiSell: num(raw.dii_gross_sell),
    diiNet: num(raw.dii_net_buy_sell),
  };
}

/* --- Dates -------------------------------------------------------------- */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today in IST as "YYYY-MM-DD" - the exchanges' calendar, not the server's. */
export function istToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/** A "YYYY-MM-DD" date moved by whole months, clamped to the month's length (31 Mar - 1 month = 28/29 Feb). */
export function shiftMonths(date: string, months: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

const daysBetween = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86_400_000;

/** A real calendar date, not just the right shape: "2026-02-30" parses to March. */
const isDate = (value: string | null): value is string =>
  !!value && ISO_DATE.test(value) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

export interface FiiDiiQuery {
  period: FiiDiiPeriod;
  from: string;
  to: string;
}

/**
 * The view a request asks for, with anything unusable replaced by the default
 * rather than rejected: a hand-edited address should still land on data.
 * Custom ranges are ordered, kept out of the future, and capped in length.
 */
export function resolveQuery(params: URLSearchParams): FiiDiiQuery {
  const requested = params.get("period");
  const period = PERIODS.find((option) => option.id === requested)?.id ?? "daily";
  const today = istToday();
  const fallback = { period, from: shiftMonths(today, -WINDOW_MONTHS[period]), to: today };

  if (period !== "custom") return fallback;

  let from = params.get("from");
  let to = params.get("to");
  if (!isDate(from) || !isDate(to)) return fallback;
  if (from > to) [from, to] = [to, from];
  if (to > today) to = today;
  if (from > to) return fallback;
  if (daysBetween(from, to) > MAX_CUSTOM_DAYS) from = shiftMonths(to, -12);
  return { period, from, to };
}

/* --- Fetch -------------------------------------------------------------- */

async function readRows({ period, from, to }: FiiDiiQuery): Promise<FiiDiiRow[] | null> {
  // A custom range is drawn a bar per day.
  const bucket = period === "custom" ? "daily" : period;
  const params = new URLSearchParams({ period: bucket, from_date: from, to_date: to });

  try {
    const response = await fetch(`${getFrappeUrl()}/api/method/${METHOD}?${params}`, {
      headers: { Authorization: `token ${getFrappeToken()}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as { message?: RawRow[] };
    if (!Array.isArray(body.message)) return null;
    return body.message.map(toRow).filter((row): row is FiiDiiRow => row !== null);
  } catch (error) {
    console.error("FII/DII lookup failed:", error);
    return null;
  }
}

/**
 * Rows for one view, newest first as the API sends them. Null when Frappe
 * couldn't be asked and nothing was cached.
 *
 * The exchanges publish the day's provisional figures once, in the evening, so
 * a value is served fresh for ten minutes and then refreshed in the background
 * for up to a day - a visitor never waits on Frappe for data that rarely moves.
 */
export function fetchFiiDii(
  query: FiiDiiQuery,
  waitUntil?: (promise: Promise<unknown>) => void,
): Promise<FiiDiiRow[] | null> {
  return swr(`fii-dii:${query.period}:${query.from}:${query.to}`, () => readRows(query), {
    freshSeconds: 10 * 60,
    staleSeconds: 24 * 60 * 60,
    // An empty answer is usually a gap upstream; don't hold it for a day.
    keep: (rows) => rows.length > 0,
    waitUntil,
  });
}
