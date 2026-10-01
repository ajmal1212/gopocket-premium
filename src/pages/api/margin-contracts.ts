import type { APIRoute } from "astro";
import {
  CONTRACT_KINDS,
  MARGIN_EXCHANGES,
  listContracts,
  searchUnderlyings,
  type ContractKind,
  type MarginExchange,
} from "@/lib/margin";

/**
 * Contract Master lookups for the margin calculator's step-by-step form.
 * Runs here because the Frappe token is server-side.
 *
 *   ?exchange=NFO&kind=OPT&q=NIF                          -> { results: [{ symbol, expiry }] }
 *   ?exchange=NFO&kind=OPT&symbol=NIFTY&expiry=2026-10-06 -> { contracts: [...] }
 *
 * The first fills the Symbol - Expiry field; the second resolves a choice to
 * the future, or to the option chain the Option type and Strike fields offer.
 */

const MAX_QUERY = 30;
const SYMBOL = /^[A-Z0-9&_-]{1,40}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const json = (body: unknown, cache: boolean) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Contract Master is regenerated daily; a minute absorbs a typed query's burst.
      "Cache-Control": cache ? "public, max-age=60" : "no-store",
    },
  });

export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams;
  const exchange = params.get("exchange") as MarginExchange;
  const kind = params.get("kind") as ContractKind;
  if (!MARGIN_EXCHANGES.includes(exchange) || !CONTRACT_KINDS.includes(kind)) {
    return json({ results: [], contracts: [] }, false);
  }

  const symbol = (params.get("symbol") || "").toUpperCase();
  const expiry = params.get("expiry") || "";
  if (symbol || expiry) {
    if (!SYMBOL.test(symbol) || !ISO_DATE.test(expiry)) return json({ contracts: [] }, false);
    const contracts = await listContracts(exchange, kind, symbol, expiry);
    return json({ contracts }, contracts.length > 0);
  }

  const term = (params.get("q") || "").trim().replace(/\s+/g, "").slice(0, MAX_QUERY);
  const results = term ? await searchUnderlyings(term, exchange, kind) : [];
  return json({ results }, results.length > 0);
};
