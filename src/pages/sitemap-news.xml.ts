import type { APIRoute } from "astro";
import { getNewsList } from "@/lib/frappe";
import { escapeXml, originFor, unavailable } from "@/lib/sitemap";

/**
 * Every /news article, newest first, at /sitemap-news.xml.
 *
 * The articles used to sit in /sitemap-pages.xml among the marketing pages;
 * they live here so Search Console reports news coverage on its own and the
 * file can carry Google News markup.
 *
 * Google News only reads <news:news> on articles published in the last two
 * days and asks that older ones drop it, so the tag goes on those alone. Every
 * article is still listed as a plain <url> with its <lastmod>, which is what
 * ordinary search uses.
 */

/** Frappe reads a page length of 0 as "every row". */
const ALL = 0;

const NEWS_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

export const GET: APIRoute = async ({ site, url }) => {
  const SITE = originFor(site, url);

  // getNewsList answers [] when Frappe is down. An empty urlset would tell
  // Search Console every article is gone; a 503 makes it keep what it has.
  const articles = await getNewsList(ALL).catch(() => []);
  if (articles.length === 0) return unavailable();

  const now = Date.now();

  const urls = articles
    .map((article) => {
      const loc = `${SITE}/news/${article.slug}`;
      const lastmod = article.modifiedISO || article.publishedISO;
      const published = article.publishedISO ? new Date(article.publishedISO) : null;
      const isFresh = published && !Number.isNaN(published.getTime()) && now - published.getTime() < NEWS_WINDOW_MS;

      return (
        `  <url>\n    <loc>${escapeXml(loc)}</loc>` +
        (lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : "") +
        (isFresh
          ? `\n    <news:news>` +
            `\n      <news:publication>\n        <news:name>GoPocket</news:name>\n        <news:language>en</news:language>\n      </news:publication>` +
            `\n      <news:publication_date>${published.toISOString()}</news:publication_date>` +
            `\n      <news:title>${escapeXml(article.title)}</news:title>` +
            `\n    </news:news>`
          : "") +
        `\n  </url>`
      );
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Matches the RSS feed: news moves faster than the other sitemaps' hour.
      "Cache-Control": "public, max-age=900",
    },
  });
};
