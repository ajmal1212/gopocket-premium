import type { APIRoute } from "astro";
import { getNewsList } from "@/lib/frappe";
import { escapeXml, originFor } from "@/lib/sitemap";

/**
 * RSS 2.0 feed of the newest news articles, at /news/rss.xml.
 *
 * Google Discover reads a site's feed - found through the
 * <link rel="alternate" type="application/rss+xml"> on the news pages - to
 * offer a "Follow" button and pick up new stories sooner. Feed readers and
 * aggregators use the same file.
 *
 * Each item carries its 1280x720 main image as <media:content>: Discover and
 * most readers show that image, and fall back to no picture without it. The
 * summary is the article's meta description, not the full body, which keeps
 * the feed small and sends readers to the page itself.
 *
 * It is a static route, so it wins over news/[slug].astro for "rss.xml".
 */

const ITEM_COUNT = 30;

const tag = (name: string, value?: string | null) => (value ? `\n      <${name}>${escapeXml(value)}</${name}>` : "");

/** RSS dates are RFC 822 ("Tue, 07 Oct 2026 03:47:35 GMT"); null when the source date is missing or invalid. */
const rfc822 = (iso?: string | null): string | null => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toUTCString();
};

export const GET: APIRoute = async ({ site, url }) => {
  const SITE = originFor(site, url);
  const feedUrl = `${SITE}/news/rss.xml`;

  // Guarded like the sitemap: if Frappe is down the feed still answers, empty,
  // rather than 500ing and making readers drop it.
  const articles = await getNewsList(ITEM_COUNT, true).catch(() => []);

  const items = articles
    .map((article) => {
      const link = `${SITE}/news/${article.slug}`;
      // Through URL so a CMS filename with spaces is percent-encoded.
      const image = article.mainImage ? new URL(article.mainImage, SITE).href : null;
      return (
        `    <item>` +
        tag("title", article.title) +
        tag("link", link) +
        `\n      <guid isPermaLink="true">${escapeXml(link)}</guid>` +
        tag("description", article.description || article.summary) +
        tag("pubDate", rfc822(article.publishedISO)) +
        tag("dc:creator", "GoPocket") +
        article.categories.map((category) => tag("category", category)).join("") +
        (image ? `\n      <media:content url="${escapeXml(image)}" medium="image" />` : "") +
        `\n    </item>`
      );
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>GoPocket News</title>
    <link>${SITE}/news</link>
    <description>IPO updates, market moves and regulatory changes, explained for Indian investors.</description>
    <language>en-in</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE}/favicon.png</url>
      <title>GoPocket News</title>
      <link>${SITE}/news</link>
    </image>${tag("lastBuildDate", rfc822(articles[0]?.publishedISO))}
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // News moves faster than the sitemap's hour.
      "Cache-Control": "public, max-age=900",
    },
  });
};
