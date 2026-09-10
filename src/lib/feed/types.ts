/**
 * A merged quote as the feed hub broadcasts it.
 *
 * Field names come from the upstream Noren feed and are kept verbatim so the
 * hub does no renaming: `lp` last price, `pc` percent change, `c` previous
 * close, `ts` the instrument name. Everything is a string - the feed sends
 * decimals as text, and parsing is left to the point of display.
 */
export interface Tick {
  /** "EXCHANGE|TOKEN", e.g. "NSE|3045". */
  k: string;
  e?: string;
  tk?: string;
  /** Instrument name, e.g. "SBIN-EQ". */
  ts?: string;
  lp?: string;
  pc?: string;
  c?: string;
  o?: string;
  h?: string;
  l?: string;
  v?: string;
  ap?: string;
  bp1?: string;
  sp1?: string;
  bq1?: string;
  sq1?: string;
  ft?: string;
}

export type TickListener = (tick: Tick) => void;
