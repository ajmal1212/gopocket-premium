import { defineMiddleware } from "astro:middleware";
import goneList from "@/lib/gone-urls.txt?raw";

/**
 * 410 Gone for pages removed on purpose (mostly old Webflow URLs).
 *
 * A 404 tells Google "not here right now" and it keeps re-crawling for weeks;
 * a 410 says the removal is deliberate and the URL drops out of the index
 * sooner. The list lives in src/lib/gone-urls.txt so it can be maintained
 * without touching code.
 *
 * The response body is the site's own 404 page, so a person who follows an
 * old link still gets the normal "not found" screen and navigation - only the
 * status code differs.
 */

// Paths are compared lowercased with no trailing slash, matching
// trailingSlash: "never". Full URLs in the list are reduced to their path.
function normalize(value: string): string {
  const path = new URL(value, "https://www.gopocket.in").pathname.toLowerCase();
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

const exact = new Set<string>();
const prefixes: string[] = [];

for (const raw of goneList.split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  if (line.endsWith("/*")) prefixes.push(normalize(line.slice(0, -2)) + "/");
  else exact.add(normalize(line));
}

function isGone(pathname: string): boolean {
  const path = normalize(pathname);
  return exact.has(path) || prefixes.some((prefix) => path.startsWith(prefix));
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (!isGone(context.url.pathname)) return next();

  const page = await context.rewrite("/404");
  const headers = new Headers(page.headers);
  headers.set("X-Robots-Tag", "noindex");
  return new Response(page.body, { status: 410, statusText: "Gone", headers });
});
