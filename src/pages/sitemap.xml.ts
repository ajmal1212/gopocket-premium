import type { APIRoute } from "astro";
import { SITEMAP_CHUNK_SIZE, listSitemapSlugs } from "@/lib/contracts";
import { originFor, renderSitemapIndex, unavailable, xmlResponse } from "@/lib/sitemap";

/**
 * The sitemap index, and the one address robots.txt advertises.
 *
 * It used to be a single <urlset> of the static pages and the blog. That list
 * now lives at /sitemap-pages.xml, and the ~22,000 /stocks addresses are split
 * across /sitemap-stocks-N.xml, because one document holding all of them would
 * be several megabytes built on every cache miss.
 *
 * Crawlers follow an index to its children, so nothing needs to change in
 * robots.txt or Search Console - /sitemap.xml still resolves and still leads
 * to every URL the site wants indexed.
 */
export const GET: APIRoute = async ({ site, url, locals }) => {
  const SITE = originFor(site, url);
  const waitUntil = locals.runtime?.ctx?.waitUntil?.bind(locals.runtime.ctx);

  // No complete stock list anywhere - only on a cold cache while Contract
  // Master is down. An index without the stock sitemaps would tell Search
  // Console those ~7,000 URLs are gone; a 503 tells it to keep what it has and
  // retry. (listSitemapSlugs serves the last good list whenever there is one.)
  const slugs = await listSitemapSlugs(waitUntil);
  if (!slugs) return unavailable();

  const children = [`${SITE}/sitemap-pages.xml`, `${SITE}/sitemap-news.xml`];
  const chunks = Math.ceil(slugs.length / SITEMAP_CHUNK_SIZE);
  for (let page = 1; page <= chunks; page += 1) {
    children.push(`${SITE}/sitemap-stocks-${page}.xml`);
  }

  return xmlResponse(renderSitemapIndex(children));
};
