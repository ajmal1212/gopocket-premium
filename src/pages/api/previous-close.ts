import type { APIRoute } from "astro";
import { fetchLatestSession } from "@/lib/feed/candles";

/**
 * The close each change should be measured from, for prices shown in the
 * browser off the live feed alone - the header search's rows.
 *
 * Once a new day begins, a weekend or holiday included, the broker rolls every
 * instrument's previous close forward to the last session's own close, so the
 * feed sends `c` equal to `lp` and `pc` 0.00 and Friday's move reads +0.00 all
 * weekend. The stock page measures from the session before on the server (see
 * `previousClose` in candles.ts); this hands the same figure to the browser.
 *
 * Only tokens whose latest session isn't today are answered. On a trading day
 * the feed's own close is right, and a token left out tells the caller so.
 */

/** "NSE|1333": an exchange and a token. */
const TOKEN = /^[A-Z_]{2,12}\|[\w-]{1,40}$/;
/** The popup shows at most eight rows; anything past that isn't a search row. */
const MAX_TOKENS = 10;

export const GET: APIRoute = async ({ url }) => {
  const tokens = [...new Set((url.searchParams.get("tokens") || "").split(","))]
    .filter((token) => TOKEN.test(token))
    .slice(0, MAX_TOKENS);

  // Closed sessions are cached per token for five minutes (see closedSession),
  // so a popup reopened over the weekend costs the hub nothing.
  const sessions = await Promise.all(tokens.map((token) => fetchLatestSession(token)));
  const closes: Record<string, number> = {};
  tokens.forEach((token, index) => {
    const close = sessions[index].previousClose;
    if (close !== null) closes[token] = close;
  });

  return new Response(JSON.stringify({ closes }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // A closed session's close can't change; an empty answer may be a trading
      // day or the hub being unreachable, so it is only held briefly.
      "Cache-Control": Object.keys(closes).length > 0 ? "public, max-age=300" : "public, max-age=30",
    },
  });
};
