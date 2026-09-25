import type { APIRoute } from "astro";
import { SITEMAP_CHUNK_SIZE, listSitemapSlugs } from "@/lib/contracts";
import { originFor, renderUrlset, xmlResponse, type SitemapEntry } from "@/lib/sitemap";

/**
 * One chunk of /stocks addresses, at /sitemap-stocks-1.xml, -2.xml and so on.
 *
 * The full cash-market list is around 22,000 URLs. Serving it as one document
 * would mean building several megabytes on every cache miss; chunked, each
 * response stays small and the underlying contract walk is shared between them
 * (see listSitemapSlugs).
 *
 * The page number is 1-based to match the index, and a request outside the
 * range 404s rather than returning an empty urlset - an empty sitemap reads to
 * a crawler as "these URLs are gone".
 */
export const GET: APIRoute = async ({ params, site, url }) => {
  const page = Number(params.page);
  if (!Number.isInteger(page) || page < 1) return new Response("Not found", { status: 404 });

  const slugs = await listSitemapSlugs();
  const chunk = slugs.slice((page - 1) * SITEMAP_CHUNK_SIZE, page * SITEMAP_CHUNK_SIZE);
  if (chunk.length === 0) return new Response("Not found", { status: 404 });

  const SITE = originFor(site, url);

  // No lastmod: Contract Master carries no per-instrument modified date, and a
  // fabricated one (today, say) would tell a crawler every page changed daily.
  const entries: SitemapEntry[] = chunk.map((slug) => ({ loc: `${SITE}/stocks/${slug}` }));

  return xmlResponse(renderUrlset(entries));
};
