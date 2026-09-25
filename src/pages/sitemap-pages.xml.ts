import type { APIRoute } from "astro";
import { getBlogPosts, getNewsList } from "@/lib/frappe";
import { originFor, renderUrlset, xmlResponse, type SitemapEntry } from "@/lib/sitemap";
import { allCategoryHrefs } from "@/components/stocks/stock-categories";

/**
 * Editorial sitemap: every static page plus the blog.
 *
 * This is what /sitemap.xml used to be. It moved here when the stock pages
 * arrived, because 22,000 instrument addresses do not belong in the same file
 * as the marketing site - see src/lib/sitemap.ts.
 */

/**
 * Routes that exist under src/pages but are deliberately kept out of the
 * sitemap: the error page, the theme's kitchen-sink demo, and /index2 -- a
 * near-duplicate of the homepage that would compete with "/" for the same
 * content. Add or remove entries here as pages come and go.
 */
const EXCLUDED = new Set(["/404", "/components", "/index2"]);

/**
 * Static routes are discovered from the filesystem so newly added pages appear
 * automatically. Dynamic routes ("[slug]", "[id]") are skipped here and
 * expanded from their data source instead. The glob only matches .astro, so the
 * sitemap endpoints themselves are never listed.
 */
function staticRoutes(): string[] {
  const modules = import.meta.glob("./**/*.astro");

  return Object.keys(modules)
    .map((file) =>
      file
        .replace(/^\./, "")
        .replace(/\.astro$/, "")
        .replace(/\/index$/, "/"),
    )
    .filter((route) => !route.includes("["))
    .map((route) => (route !== "/" && route.endsWith("/") ? route.slice(0, -1) : route))
    .filter((route) => !EXCLUDED.has(route))
    .sort();
}

export const GET: APIRoute = async ({ site, url }) => {
  const SITE = originFor(site, url);
  const entries: SitemapEntry[] = [];

  for (const route of staticRoutes()) {
    const isHome = route === "/";
    const isIndex = route === "/blog" || route === "/news" || route === "/ipo";
    entries.push({
      loc: isHome ? `${SITE}/` : `${SITE}${route}`,
      changefreq: isHome || isIndex ? "daily" : "monthly",
      priority: isHome ? "1.0" : isIndex ? "0.9" : "0.7",
    });
  }

  // The sector, industry and market-cap landing pages under /stocks. Their
  // routes are dynamic, so the filesystem walk above skips them; the list is
  // static (stock-categories.ts), so no fetch is needed. Daily, like /stocks:
  // the prices and rankings on them move every session.
  for (const href of allCategoryHrefs()) {
    entries.push({ loc: `${SITE}${href}`, changefreq: "daily", priority: "0.8" });
  }

  // Blog articles are served by SSR routes, so they have to be enumerated from
  // Frappe. Guarded: if Frappe is unreachable the sitemap still ships with the
  // static pages rather than 500ing.
  try {
    const posts = await getBlogPosts(200);
    for (const post of posts) {
      entries.push({
        loc: `${SITE}/blog/${post.slug}`,
        lastmod: post.modifiedISO || post.publishedISO || undefined,
        changefreq: "monthly",
        priority: "0.8",
      });
    }
  } catch (error) {
    console.error("sitemap: could not load blog posts", error);
  }

  // News articles are SSR routes too, and enumerated the same guarded way.
  try {
    const articles = await getNewsList(200);
    for (const article of articles) {
      entries.push({
        loc: `${SITE}/news/${article.slug}`,
        lastmod: article.modifiedISO || article.publishedISO || undefined,
        changefreq: "monthly",
        priority: "0.8",
      });
    }
  } catch (error) {
    console.error("sitemap: could not load news articles", error);
  }

  // Seminars are deliberately NOT listed. Each one drops off the site once its
  // grace window closes, so any URL published here would go stale within days
  // and leave crawlers chasing entries that no longer resolve to a live
  // listing. The detail pages stay reachable; they just aren't advertised.

  return xmlResponse(renderUrlset(entries));
};
