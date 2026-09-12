/**
 * Trading session times, per exchange.
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
const hm = (hours: number, minutes: number) => hours * 3600 + minutes * 60;

/** NSE and BSE - cash, F&O and indices alike: 9:15 to 3:30. */
const EQUITY = { open: hm(9, 15), close: hm(15, 30) };

/**
 * MCX trades from 9:00 into the night, and its close follows the US markets
 * its bullion and energy contracts track: 11:30 PM while the US is on summer
 * time, 11:55 PM the rest of the year.
 */
const MCX_OPEN = hm(9, 0);
const MCX_CLOSE_US_SUMMER = hm(23, 30);
const MCX_CLOSE_US_WINTER = hm(23, 55);

/**
 * Whether US daylight saving is in force on a date: from the second Sunday of
 * March to the first Sunday of November. Both switches fall on a Sunday, when
 * MCX is shut, so the day alone decides - no need for the hour of the change.
 */
function usSummerTime(year: number, month: number, day: number): boolean {
  const nthSunday = (m: number, n: number) => 1 + ((7 - new Date(Date.UTC(year, m, 1)).getUTCDay()) % 7) + (n - 1) * 7;
  const date = Date.UTC(year, month, day);
  return date >= Date.UTC(year, 2, nthSunday(2, 2)) && date < Date.UTC(year, 10, nthSunday(10, 1));
}

/**
 * The open-to-close window of the IST calendar day that `epoch` falls on, on
 * the given exchange. Anything but MCX keeps equity hours: NFO and BFO are
 * NSE's and BSE's own derivatives, and an index trades when its market does.
 */
/** Epoch seconds at the start of the IST calendar day that `epoch` falls on. */
export const istMidnightOf = (epoch: number): number => Math.floor((epoch + IST_OFFSET) / DAY) * DAY - IST_OFFSET;

export function sessionAt(epoch: number, exchange = "NSE"): Session {
  const istMidnight = istMidnightOf(epoch);
  if (exchange !== "MCX") return { start: istMidnight + EQUITY.open, end: istMidnight + EQUITY.close };

  // The UTC fields of IST midnight shifted by the offset are the IST date.
  const date = new Date((istMidnight + IST_OFFSET) * 1000);
  const summer = usSummerTime(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return {
    start: istMidnight + MCX_OPEN,
    end: istMidnight + (summer ? MCX_CLOSE_US_SUMMER : MCX_CLOSE_US_WINTER),
  };
}
