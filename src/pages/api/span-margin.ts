import type { APIRoute } from "astro";
import {
  MARGIN_EXCHANGES,
  MARGIN_PRODUCTS,
  calculateMargin,
  type MarginPosition,
  type MarginProduct,
} from "@/lib/margin";

/**
 * SPAN + exposure margin for a basket of F&O positions.
 *
 * A public proxy onto an authenticated Frappe method, so the body is checked
 * strictly before it is forwarded. The cap on positions also caps the fan-out:
 * calculateMargin prices every leg on its own as well as the basket.
 */

const MAX_POSITIONS = 10;
const MAX_QUANTITY = 1_000_000;
// "." for half-point strikes, e.g. WIPRO27OCT26C107.5.
const SYMBOL = /^[A-Z0-9&_.-]{1,40}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function parsePositions(value: unknown): MarginPosition[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_POSITIONS) return null;
  const positions: MarginPosition[] = [];
  for (const item of value as Record<string, unknown>[]) {
    const { trading_symbol, exchange, side, quantity } = item ?? {};
    if (typeof trading_symbol !== "string" || !SYMBOL.test(trading_symbol)) return null;
    if (!MARGIN_EXCHANGES.includes(exchange as never)) return null;
    if (side !== "buy" && side !== "sell") return null;
    if (!Number.isInteger(quantity) || (quantity as number) <= 0 || (quantity as number) > MAX_QUANTITY) return null;
    positions.push({
      trading_symbol,
      exchange: exchange as MarginPosition["exchange"],
      side,
      quantity: quantity as number,
    });
  }
  return positions;
}

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as { product?: unknown; positions?: unknown } | null;
  const product = body?.product as MarginProduct;
  const positions = parsePositions(body?.positions);

  if (!MARGIN_PRODUCTS.includes(product) || !positions) {
    return json({ error: `Send a product and 1-${MAX_POSITIONS} valid positions.` }, 400);
  }

  try {
    return json(await calculateMargin(product, positions));
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Margin could not be calculated." }, 502);
  }
};
