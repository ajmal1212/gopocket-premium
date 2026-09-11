/**
 * NSE equity session times.
 *
 * Kept apart from candles.ts because the browser needs them too - the live
 * chart works out which session a tick belongs to - and that module carries
 * the server-side hub fetch, which has no business in a client bundle.
 */

export interface Session {
  /** Epoch seconds at the open. */
  start: number;
  /** Epoch seconds at the close. */
  end: number;
}

const DAY = 24 * 60 * 60;
const IST_OFFSET = 5.5 * 60 * 60;
/** Seconds past midnight IST. */
const SESSION_OPEN = 9 * 3600 + 15 * 60;
const SESSION_CLOSE = 15 * 3600 + 30 * 60;

/** The open-to-close window of the IST calendar day that `epoch` falls on. */
export function sessionAt(epoch: number): Session {
  const istMidnight = Math.floor((epoch + IST_OFFSET) / DAY) * DAY - IST_OFFSET;
  return { start: istMidnight + SESSION_OPEN, end: istMidnight + SESSION_CLOSE };
}
