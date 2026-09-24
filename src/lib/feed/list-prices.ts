import { fetchQuotes } from "./quote";
import { downsample, fetchCandles, fetchLatestSession, type Range } from "./candles";
import { istMidnightOf } from "./session";
import { num } from "./format";
import { swr } from "@/lib/edge-cache";

export interface ListPrice {
  ltp: number;
  change: number | null;
  percent: number | null;
  /** Closes across the latest session, oldest first, thinned for a sparkline. */
  trend: number[];
}

/** A row to price: its feed key and the trading symbol daily history is keyed by. */
export interface ListInstrument {
  key: string;
  tradingSymbol: string;
}

/** Ten days of daily candles: a week and a half, so a holiday weekend still leaves a session before the latest. */
const DAILY_RANGE: Range = { id: "list", label: "", interval: "day", lookback: 10 * 24 * 60 * 60 };

/** Points per sparkline - a line ~120px wide gains nothing from more. */
const TREND_POINTS = 60;

/**
 * How long the list waits on the hub. Most candle requests answer in under
 * half a second, but one in ten or so stalls for anything up to 20 seconds -
 * and with twenty in flight, some row nearly always does. Past this deadline
 * that row renders a dash instead of holding up the other nine.
 */
const DEADLINE_MS = 2500;

/**
 * Prices are kept stale-while-revalidate (see swr in edge-cache.ts). Within
 * PRICES_FRESH_S a page is served as it is; after that, up to PRICES_STALE_S,
 * the last prices go out at once and the new ones load in the background for
 * the next view - so a reload moves the prices without anyone waiting on the
 * hub. Past that a request waits, which bounds how old a price can be shown.
 */
const PRICES_FRESH_S = 20;
const PRICES_STALE_S = 3 * 60;

/**
 * A hub request still unanswered after this long is sent again, and whichever
 * copy answers first is used. The stalls are per request, not per instrument:
 * eight identical requests for one token, sent together, came back in 0.3s
 * apiece bar one that took 22s. A second copy almost always lands in the fast
 * group, so this turns most would-be dashes into prices at the cost of an
 * occasional duplicate request.
 */
const HEDGE_MS = 600;

function hedged<T>(request: () => Promise<T>): Promise<T> {
  let settled = false;
  const first = request().finally(() => (settled = true));
  const second = new Promise((resolve) => setTimeout(resolve, HEDGE_MS)).then(() => (settled ? first : request()));
  return Promise.race([first, second]);
}

function withDeadline<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), DEADLINE_MS))]);
}

const NO_SESSION = { candles: [], previousClose: null };

/**
 * Last price, day change and a 1D trend line for a handful of instruments -
 * the rows on one page of /stocks. A snapshot taken while rendering, not a
 * live feed: the list refreshes when the page does.
 *
 * The candles are the source of truth, not the hub's /quote. For an
 * instrument nobody is watching over the socket, /quote hands back its last
 * cached tick, which can be yesterday's - price and previous close both - in
 * the middle of today's session. The stock page goes live over the socket a
 * moment later and never notices; a list that only refreshes on reload would
 * show yesterday's price all day. So, per row, two small requests:
 *
 * - the latest session's one-minute candles (13KB; the stock page's own 1D
 *   fetch, cached the same way between sessions) - the trend line, and the
 *   LTP from its last candle unless the quote is newer;
 * - ten daily candles (0.5KB), whose last close before that session is the
 *   previous close. Daily or one-minute, never five: only those carry the
 *   exchange's official close - HDFC Bank's 15:25 five-minute bar once closed
 *   at 725.00 against an official 737.25. Five days of one-minute candles
 *   would do too, but at 90KB a row the page took 6-9 seconds.
 *
 * Every request is in flight at once, so the page waits on the slowest rather
 * than their sum - and never longer than DEADLINE_MS. A row whose session
 * candles don't arrive is left out and the table shows a dash: the quote alone
 * can't be trusted to be today's, and yesterday's close passed off as the LTP
 * reads as "+0.00" in green. A row with no previous close shows its price
 * without a change.
 */
export async function fetchListPrices(
  instruments: ListInstrument[],
  waitUntil?: (promise: Promise<unknown>) => void,
): Promise<Record<string, ListPrice>> {
  const prices = await swr(
    `list-prices:${instruments.map(({ key }) => key).join(",")}`,
    () => loadListPrices(instruments),
    {
      freshSeconds: PRICES_FRESH_S,
      staleSeconds: PRICES_STALE_S,
      // Only a complete answer is kept: one with a stalled row would pin a dash
      // in place for everyone. It still goes to the visitor who asked.
      keep: (loaded) => Object.keys(loaded).length === instruments.length,
      waitUntil,
    },
  );
  return prices ?? {};
}

async function loadListPrices(instruments: ListInstrument[]): Promise<Record<string, ListPrice>> {
  const [quotes, sessions, dailies] = await Promise.all([
    fetchQuotes(instruments.map(({ key }) => key)),
    Promise.all(
      instruments.map(({ key }) =>
        withDeadline(
          hedged(() => fetchLatestSession(key)),
          NO_SESSION,
        ),
      ),
    ),
    Promise.all(
      instruments.map(({ key, tradingSymbol }) =>
        withDeadline(
          hedged(() => fetchCandles(key, DAILY_RANGE, tradingSymbol)),
          [],
        ),
      ),
    ),
  ]);

  const prices: Record<string, ListPrice> = {};
  instruments.forEach(({ key }, index) => {
    const { candles, previousClose: heldClose } = sessions[index];
    const firstCandle = candles[0];
    const lastCandle = candles[candles.length - 1];
    if (!firstCandle || !lastCandle) return;

    const quote = quotes[key];
    const quoteIsNewer = quote?.lp !== undefined && (num(quote.ft) ?? 0) > lastCandle.t;
    const ltp = (quoteIsNewer ? num(quote.lp) : null) ?? lastCandle.c;

    // Between sessions fetchLatestSession already knows the close before; on a
    // trading day it's the last daily candle dated before today's session.
    const sessionDay = istMidnightOf(firstCandle.t);
    const previousClose = heldClose ?? dailies[index].findLast((day) => day.t < sessionDay)?.c ?? null;

    const change = previousClose ? ltp - previousClose : null;
    prices[key] = {
      ltp,
      change,
      percent: change !== null && previousClose ? (change / previousClose) * 100 : null,
      trend: downsample(candles, TREND_POINTS).map((candle) => candle.c),
    };
  });

  return prices;
}
