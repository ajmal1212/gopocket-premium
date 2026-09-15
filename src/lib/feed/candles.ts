import { FEED_HUB_URL } from "./config";
import { edgeGet, edgePut } from "@/lib/edge-cache";
import { istMidnightOf, istWeekday, sessionAt, type Session } from "./session";

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
export function sessionWindow(candles: Candle[], exchange?: string): Session | null {
  if (candles.length === 0) return null;
  return sessionAt(candles[candles.length - 1].t, exchange);
}

/** Daily history is keyed by trading symbol and covers equities only. */
export const isDaily = (range: Range): boolean => range.interval === "day";

export const rangeById = (id: string): Range => RANGES.find((r) => r.id === id) ?? RANGES[0];

const TIMEOUT_MS = 6000;

/**
 * Candles for one instrument between two epoch seconds, oldest first.
 *
 * Failure is an empty list rather than an exception: a stock page that cannot
 * draw a chart should still render its price and its copy.
 */
async function requestCandles(token: string, interval: Interval, from: number, to: number, tradingSymbol = "") {
  // The daily upstream is keyed by trading symbol rather than token, and
  // answers a numeric token with an empty array rather than an error.
  const symbol = interval === "day" ? `&symbol=${encodeURIComponent(tradingSymbol)}` : "";
  const url = `${FEED_HUB_URL}/candles?token=${encodeURIComponent(token)}&interval=${interval}${symbol}&from=${from}&to=${to}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return [];
    const body = (await response.json()) as { candles?: Candle[] };
    return body.candles ?? [];
  } catch {
    return [];
  }
}

/** Candles for one of the chart's ranges, reaching back its `lookback` from now. */
export async function fetchCandles(token: string, range: Range, tradingSymbol = ""): Promise<Candle[]> {
  const to = Math.floor(Date.now() / 1000);
  return requestCandles(token, range.interval, to - range.lookback, to, tradingSymbol);
}

/**
 * How far back the 1D chart looks when nothing has traded today: far enough
 * to cross a weekend with a holiday on either side of it.
 */
const QUIET_LOOKBACK = 5 * DAY;

export interface LatestSession {
  /** The latest session's one-minute candles. */
  candles: Candle[];
  /**
   * The close of the session before them - set only when the latest session
   * isn't today's, which is exactly when the feed's own previous close can't
   * be trusted. Once a new day begins (a weekend or holiday included) the
   * broker rolls its previous close forward to the last session's close, so
   * Friday's move reads +0.00 all weekend - where every broker shows it
   * measured from Thursday. See `holdPreviousClose` in client.ts.
   */
  previousClose: number | null;
}

/**
 * The latest session's one-minute candles, for the 1D chart.
 *
 * Asked for from IST midnight first: on a trading day that is the whole
 * session and nothing more. With nothing since midnight - before the open, at
 * the weekend, on a holiday - the last few days are fetched instead and cut to
 * the last session in them. A fixed 24-hour window got neither right: on a
 * Saturday morning it held Friday from mid-morning on, so the line started
 * part-way across, and on a Monday morning it reached back only to Sunday and
 * held nothing at all.
 *
 * One-minute candles rather than hourly for the earlier session's close too:
 * the last minute carries the exchange's official closing price, where the
 * hourly bar can stop at the last trade before it.
 */
export async function fetchLatestSession(token: string): Promise<LatestSession> {
  const now = Math.floor(Date.now() / 1000);
  const midnight = istMidnightOf(now);

  // No session on any exchange opens before 9:00 IST, so until then there is
  // nothing of today's to ask for.
  const opened = now >= midnight + EARLIEST_OPEN;
  // At the weekend today almost never trades - a special session (Budget day,
  // Muhurat) is the exception - so the last closed session is fetched alongside
  // today's rather than after it, and the page waits on the slower of the two
  // instead of both. On a weekday it's only needed if today turns out empty.
  const quietDay = !opened || istWeekday(now) === 0 || istWeekday(now) === 6;
  const closed = quietDay ? closedSession(token, now) : null;

  if (opened) {
    const today = await requestCandles(token, 1, midnight, now);
    if (today.length > 0) return { candles: today, previousClose: null };
  }
  return closed ?? closedSession(token, now);
}

/**
 * The last session that has closed, and the close of the one before it.
 *
 * A closed session can't change, so it is kept a few minutes - in this isolate
 * and in the data centre's shared cache - rather than fetched, a week of
 * one-minute candles, on every view. Today is always asked for first (above),
 * so a session that opens is picked up on the next request.
 */
async function closedSession(token: string, now: number): Promise<LatestSession> {
  const kept = closedSessions.get(token);
  if (kept && Date.now() - kept.at < CLOSED_SESSION_TTL_MS) return kept.value;

  const shared = await edgeGet<LatestSession>(`session:${token}`);
  if (shared) {
    keepClosed(token, shared);
    return shared;
  }

  const recent = await requestCandles(token, 1, now - QUIET_LOOKBACK, now);
  const candles = latestSession(recent);
  const before = recent[recent.length - candles.length - 1];
  const value = { candles, previousClose: before?.c ?? null };

  if (candles.length > 0) {
    keepClosed(token, value);
    await edgePut(`session:${token}`, value, CLOSED_SESSION_TTL_MS / 1000);
  }
  return value;
}

function keepClosed(token: string, value: LatestSession) {
  closedSessions.delete(token);
  closedSessions.set(token, { at: Date.now(), value });
  if (closedSessions.size > CLOSED_SESSION_LIMIT) closedSessions.delete(closedSessions.keys().next().value!);
}

/** Seconds past IST midnight at which the first session of any exchange opens (MCX, and NSE's pre-open). */
const EARLIEST_OPEN = 9 * 60 * 60;
const CLOSED_SESSION_TTL_MS = 5 * 60 * 1000;
const CLOSED_SESSION_LIMIT = 500;
/** token -> the last closed session, per isolate. */
const closedSessions = new Map<string, { at: number; value: LatestSession }>();

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
 * When nothing has traded today the hub is asked for several days, but a "1D"
 * chart should show one session. The cut is made at the last gap of over two
 * hours between consecutive candles, which is the overnight close - simpler
 * and more robust than reasoning about holidays and half-days.
 */
export function latestSession(candles: Candle[]): Candle[] {
  if (candles.length < 3) return candles;

  const GAP_SECONDS = 60 * 60 * 2;
  for (let i = candles.length - 1; i > 0; i--) {
    if (candles[i].t - candles[i - 1].t > GAP_SECONDS) return candles.slice(i);
  }
  return candles;
}
