import type { APIRoute } from "astro";
import { downsample, fetchLatestSession } from "@/lib/feed/candles";

/**
 * Today's one-minute series for a stock page's 1D chart, for the browser.
 *
 * The chart grows from live ticks, and a tab that was hidden received none -
 * the feed is let go of while nobody is looking - so coming back it asks here
 * for the session it missed. The hub's /candles answers without CORS headers,
 * so the browser can't read it directly; this passes the same series through,
 * trimmed exactly as the page's server render trims it.
 */

/** "NSE|1333": an exchange and a token. */
const TOKEN = /^[A-Z_]{2,12}\|[\w-]{1,40}$/;

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get("token") || "";
  if (!TOKEN.test(token)) {
    return new Response(JSON.stringify({ error: "bad token" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const candles = downsample((await fetchLatestSession(token)).candles);

  // Only what the chart plots: times and closes, as two flat lists.
  return new Response(JSON.stringify({ t: candles.map((c) => c.t), c: candles.map((c) => c.c) }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // The hub caches the same series for 30 seconds. An empty answer is
      // usually the hub being unreachable, and shouldn't be held on to.
      "Cache-Control": candles.length > 0 ? "public, max-age=30" : "no-store",
    },
  });
};
