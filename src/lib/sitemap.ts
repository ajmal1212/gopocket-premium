/**
 * Shared XML plumbing for the sitemap routes.
 *
 * /sitemap.xml is a sitemap *index* rather than a single urlset: the stock
 * pages alone run to roughly 22,000 addresses, and splitting them into chunks
 * keeps every SSR response small instead of building one multi-megabyte
 * document on each cache miss. robots.txt still points at /sitemap.xml, which
 * is what an index is for - crawlers follow it to the children.
 */

export interface SitemapEntry {
  loc: string;
  /** ISO-8601. Omitted where the source has no meaningful modified date. */
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tag(name: string, value?: string): string {
  return value ? `\n    <${name}>${escapeXml(value)}</${name}>` : "";
}

/** A <urlset> document: the leaf sitemaps. */
export function renderUrlset(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (entry) =>
        `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>` +
        tag("lastmod", entry.lastmod) +
        tag("changefreq", entry.changefreq) +
        tag("priority", entry.priority) +
        `\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/** A <sitemapindex> document: the one at /sitemap.xml. */
export function renderSitemapIndex(locations: string[]): string {
  const items = locations.map((loc) => `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n  </sitemap>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>
`;
}

export function xmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/**
 * The origin to build absolute URLs from: the `site` value in astro.config.mjs,
 * falling back to the request origin only when no `site` is configured. Pinned
 * deliberately, so a staging deploy never publishes its own hostname.
 */
export function originFor(site: URL | undefined, url: URL): string {
  return (site ?? new URL(url)).origin;
}
