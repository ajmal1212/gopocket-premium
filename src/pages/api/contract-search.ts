import type { APIRoute } from "astro";
import { SEARCH_SEGMENTS, searchContracts } from "@/lib/contracts";

/**
 * Instrument search for the header popup.
 *
 * The query runs here rather than in the browser because the Frappe token is a
 * server-side secret - a client-side SDK call would ship it to every visitor.
 * It also keeps the response capped and shaped for the UI, instead of exposing
 * an open search over the whole contract master.
 *
 * `segment` is the popup's tab - "nfo", "mcx" and so on - which picks the
 * exchanges searched. Anything unknown searches them all.
 */

const MIN_QUERY = 2;
/** The popup shows five matches, each a live feed subscription - see LIST_LIMIT in GlobalSearch.astro. */
const LIMIT = 5;

export const GET: APIRoute = async ({ url }) => {
  const term = (url.searchParams.get("q") || "").trim();
  const segment = SEARCH_SEGMENTS.find((s) => s.id === url.searchParams.get("segment")) ?? SEARCH_SEGMENTS[0];

  const results = term.length < MIN_QUERY ? [] : await searchContracts(term, LIMIT, segment);

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // The contract master is regenerated daily, so a minute of caching costs
      // nothing and absorbs the burst a typed query produces.
      "Cache-Control": results.length > 0 ? "public, max-age=60" : "no-store",
    },
  });
};
