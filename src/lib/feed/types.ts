/** The five price levels of market depth. */
export type DepthLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Per-level depth fields: `bp`/`sp` bid and ask price, `bq`/`sq` quantity,
 * `bo`/`so` number of orders. Level 1 (the best bid and ask) also arrives on a
 * plain price subscription; levels 2-5 only once depth is asked for.
 */
type DepthFields = Partial<Record<`${"bp" | "sp" | "bq" | "sq" | "bo" | "so"}${DepthLevel}`, string>>;

/**
 * A merged quote as the feed hub broadcasts it.
 *
 * Field names come from the upstream Noren feed and are kept verbatim so the
 * hub does no renaming: `lp` last price, `pc` percent change, `c` previous
 * close, `ts` the instrument name. Everything is a string - the feed sends
 * decimals as text, and parsing is left to the point of display.
 */
export interface Tick extends DepthFields {
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
  ft?: string;
  /* Depth subscriptions only. */
  /** Total quantity bid / offered across the whole book. */
  tbq?: string;
  tsq?: string;
  /** 52-week high and low. */
  "52h"?: string;
  "52l"?: string;
  /** Upper and lower circuit limits for the day. */
  uc?: string;
  lc?: string;
}

export type TickListener = (tick: Tick) => void;
