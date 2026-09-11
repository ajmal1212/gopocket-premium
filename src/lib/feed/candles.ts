import { FEED_HUB_URL } from "./config";
import { sessionAt, type Session } from "./session";

export interface Candle {
  /** Epoch seconds at the start of the candle. */
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

/** Minutes per candle the hub accepts; 60 is the hourly, "day" is end-of-day. */
export type Interval = 1 | 2 | 3 | 4 | 5 | 10 | 15 | 30 | 45 | 60 | "day";

export interface Range {
  /** Query-string value and button label. */
  id: string;
  label: string;
  interval: Interval;
  /** How far back to ask for, in seconds. */
  lookback: number;
}

/**
 * The ranges offered under the chart.
 *
 * Coarser candles over longer windows on purpose: a month of one-minute bars is
 * ten thousand points to draw a line a few hundred pixels wide, and the shape
 * is identical to the hourly. Anything past a month wants daily candles, which
 * come from a different upstream endpoint.
 */
const DAY = 24 * 60 * 60;

export const RANGES: Range[] = [
  { id: "1D", label: "1D", interval: 1, lookback: DAY },
  { id: "1W", label: "1W", interval: 30, lookback: 7 * DAY },
  { id: "1M", label: "1M", interval: 60, lookback: 30 * DAY },
  { id: "6M", label: "6M", interval: "day", lookback: 183 * DAY },
  { id: "1Y", label: "1Y", interval: "day", lookback: 365 * DAY },
  { id: "5Y", label: "5Y", interval: "day", lookback: 5 * 365 * DAY },
];

/**
 * The open-to-close window of the session the given candles belong to.
 *
 * An intraday chart is plotted against this rather than against its own data,
 * so at noon the line reaches the middle of the chart and stops - the way every
 * broker draws it. Plotting by index instead stretches half a session across
 * the full width, which reads as a complete day and misstates the shape.
 */
export function sessionWindow(candles: Candle[]): Session | null {
  if (candles.length === 0) return null;
  return sessionAt(candles[candles.length - 1].t);
}

/** Daily history is keyed by trading symbol and covers equities only. */
export const isDaily = (range: Range): boolean => range.interval === "day";

export const rangeById = (id: string): Range => RANGES.find((r) => r.id === id) ?? RANGES[0];

const TIMEOUT_MS = 6000;

/**
 * Candles for one instrument, oldest first.
 *
 * Failure is an empty list rather than an exception: a stock page that cannot
 * draw a chart should still render its price and its copy.
 */
export async function fetchCandles(token: string, range: Range, tradingSymbol = ""): Promise<Candle[]> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - range.lookback;
  // The daily upstream is keyed by trading symbol rather than token, and
  // answers a numeric token with an empty array rather than an error.
  const symbol = isDaily(range) ? `&symbol=${encodeURIComponent(tradingSymbol)}` : "";
  const url = `${FEED_HUB_URL}/candles?token=${encodeURIComponent(token)}&interval=${range.interval}${symbol}&from=${from}&to=${to}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return [];
    const body = (await response.json()) as { candles?: Candle[] };
    return body.candles ?? [];
  } catch {
    return [];
  }
}

/**
 * Thin a long series down to something worth drawing.
 *
 * Five years of daily candles is a thousand points for a path a few hundred
 * pixels wide - more than one point per pixel, so the extra detail is invisible
 * and costs about 14KB of path data plus the same again in raw values. Striding
 * keeps the shape and always keeps the last point, which is the one the live
 * price replaces.
 */
export function downsample(candles: Candle[], max = 400): Candle[] {
  if (candles.length <= max) return candles;

  const stride = Math.ceil(candles.length / max);
  const thinned = candles.filter((_, index) => index % stride === 0);
  const last = candles[candles.length - 1];
  if (thinned[thinned.length - 1]?.t !== last.t) thinned.push(last);
  return thinned;
}

/**
 * Trim to the latest trading session.
 *
 * The hub is asked for 24 hours so a Monday morning still has Friday to fall
 * back on, but a "1D" chart should show one session. The cut is made at the
 * largest gap between consecutive candles, which is the overnight close -
 * simpler and more robust than reasoning about holidays and half-days.
 */
export function latestSession(candles: Candle[]): Candle[] {
  if (candles.length < 3) return candles;

  const GAP_SECONDS = 60 * 60 * 2;
  for (let i = candles.length - 1; i > 0; i--) {
    if (candles[i].t - candles[i - 1].t > GAP_SECONDS) return candles.slice(i);
  }
  return candles;
}
