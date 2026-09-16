import type { APIRoute } from "astro";
import { SITEMAP_CHUNK_SIZE, listSitemapSlugs } from "@/lib/contracts";
import { originFor, renderSitemapIndex, xmlResponse } from "@/lib/sitemap";

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
export const GET: APIRoute = async ({ site, url }) => {
  const SITE = originFor(site, url);
  const children = [`${SITE}/sitemap-pages.xml`];

  // Guarded like every other data source here: if Contract Master is
  // unreachable the index still ships with the editorial sitemap rather than
  // 500ing and taking the whole thing down with it.
  try {
    const slugs = await listSitemapSlugs();
    const chunks = Math.ceil(slugs.length / SITEMAP_CHUNK_SIZE);
    for (let page = 1; page <= chunks; page += 1) {
      children.push(`${SITE}/sitemap-stocks-${page}.xml`);
    }
  } catch (error) {
    console.error("sitemap: could not enumerate stock pages", error);
  }

  return xmlResponse(renderSitemapIndex(children));
};
