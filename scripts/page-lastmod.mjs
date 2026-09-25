/**
 * Writes src/lib/page-lastmod.json: the last git commit date of every page
 * under src/pages, keyed the way import.meta.glob keys them ("./pricing.astro").
 *
 * The sitemap emits these as <lastmod>, matching what the old Webflow sitemap
 * published. It has to happen at build time - the Worker has no filesystem
 * and no git - so this runs from the predev/prebuild npm hooks.
 *
 * A page with no history (new, uncommitted) is simply left out, and the
 * sitemap then omits its lastmod rather than inventing one. On a shallow
 * clone every page reports the same HEAD date: less precise, never wrong.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const PAGES = "src/pages";

function astroFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return astroFiles(path);
    return entry.name.endsWith(".astro") ? [path] : [];
  });
}

function lastCommitDate(file) {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cI", "--", file], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const lastmod = {};
for (const file of astroFiles(PAGES)) {
  const date = lastCommitDate(file);
  if (date) lastmod[`./${relative(PAGES, file).replaceAll("\\", "/")}`] = new Date(date).toISOString();
}

writeFileSync("src/lib/page-lastmod.json", JSON.stringify(lastmod, null, 2) + "\n");
console.log(`page-lastmod: ${Object.keys(lastmod).length} pages`);
