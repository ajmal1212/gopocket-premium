import type { Tick } from "./types";

/**
 * Server-side quote lookup, used while rendering.
 *
 * A stock page ships its opening price in the HTML rather than a dash that
 * fills in after hydration: better for the largest-contentful paint, no layout
 * shift when the socket connects, and something for a crawler to index. The hub
 * answers from its cache, subscribing on demand if nobody is watching the
 * instrument yet.
 */

const HUB_URL = import.meta.env.FEED_HUB_URL || "http://172.16.1.3:8090";
const TIMEOUT_MS = 2500;

export async function fetchQuotes(tokens: string[]): Promise<Record<string, Tick>> {
  if (tokens.length === 0) return {};

  // A page must render even when the hub is down or slow - a missing price is a
  // dash, never a failed response.
  try {
    const url = `${HUB_URL}/quote?tokens=${encodeURIComponent(tokens.join(","))}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return {};
    const body = (await response.json()) as { ticks?: Record<string, Tick> };
    return body.ticks || {};
  } catch {
    return {};
  }
}

export async function fetchQuote(token: string): Promise<Tick | null> {
  const quotes = await fetchQuotes([token]);
  return quotes[token] || null;
}
