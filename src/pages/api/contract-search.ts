import type { APIRoute } from "astro";
import { searchContracts } from "@/lib/contracts";

/**
 * Instrument search for the header popup.
 *
 * The query runs here rather than in the browser because the Frappe token is a
 * server-side secret - a client-side SDK call would ship it to every visitor.
 * It also keeps the response capped and shaped for the UI, instead of exposing
 * an open search over the whole contract master.
 */

const MIN_QUERY = 2;
const LIMIT = 30;

export const GET: APIRoute = async ({ url }) => {
  const term = (url.searchParams.get("q") || "").trim();

  const results = term.length < MIN_QUERY ? [] : await searchContracts(term, LIMIT);

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
