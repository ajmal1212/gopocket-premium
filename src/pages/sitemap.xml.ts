import type { APIRoute } from "astro";
import { getBlogPosts, getSeminars } from "../lib/frappe";

const SITE = "https://gopocket.in";

/**
 * Routes that exist under src/pages but are deliberately kept out of the
 * sitemap: the error page, the theme's kitchen-sink demo, and /index2 -- a
 * near-duplicate of the homepage that would compete with "/" for the same
 * content. Add or remove entries here as pages come and go.
 */
const EXCLUDED = new Set(["/404", "/components", "/index2"]);

interface Entry {
  loc: string;
  lastmod?: string;
  changefreq: string;
  priority: string;
}

/**
 * Static routes are discovered from the filesystem so newly added pages appear
 * automatically. Dynamic routes ("[slug]", "[id]") are skipped here and
 * expanded from their data source below.
 */
function staticRoutes(): string[] {
  const modules = import.meta.glob("./**/*.astro");

  return Object.keys(modules)
    .map((file) => file.replace(/^\./, "").replace(/\.astro$/, "").replace(/\/index$/, "/"))
    .filter((route) => !route.includes("["))
    .map((route) => (route !== "/" && route.endsWith("/") ? route.slice(0, -1) : route))
    .filter((route) => !EXCLUDED.has(route))
    .sort();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderEntry(entry: Entry): string {
  const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : "";
  return `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${lastmod}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
}

export const GET: APIRoute = async () => {
  const entries: Entry[] = [];

  for (const route of staticRoutes()) {
    const isHome = route === "/";
    const isBlogIndex = route === "/blog";
    entries.push({
      loc: isHome ? `${SITE}/` : `${SITE}${route}`,
      changefreq: isHome || isBlogIndex ? "daily" : "monthly",
      priority: isHome ? "1.0" : isBlogIndex ? "0.9" : "0.7",
    });
  }

  // Blog articles and seminars are served by SSR routes, so they have to be
  // enumerated from Frappe. Each source is guarded independently: if one is
  // unreachable the sitemap still ships with everything else rather than 500ing.
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

  try {
    const seminars = await getSeminars();
    for (const seminar of seminars) {
      entries.push({
        loc: `${SITE}/research-learn/${seminar.id}`,
        changefreq: "weekly",
        priority: "0.6",
      });
    }
  } catch (error) {
    console.error("sitemap: could not load seminars", error);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(renderEntry).join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
