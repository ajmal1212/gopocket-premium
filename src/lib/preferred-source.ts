/**
 * "Add GoPocket as a preferred source on Google" - the button readers press to
 * see more of the site in Google's Top Stories and AI results.
 *
 * Every trigger is a plain link to Google's deep link
 * (google.com/preferences/source?q=gopocket.in), so it works with no script at
 * all. This upgrades it to Google's in-page popup, the flow documented at
 * developers.google.com/search/docs/appearance/preferred-sources: their
 * publisher.mjs opens a small Google window and returns the reader to the page.
 *
 * That script is third-party and only a fraction of readers ever press the
 * button, so it is not loaded with the page. It starts loading the moment a
 * reader shows intent - pointer over, focus, or touch - and is normally ready
 * by the click. If it isn't (a very fast tap, or Google unreachable) the click
 * is left alone and the deep link opens in a new tab instead. Awaiting the
 * download inside the click would risk the popup being blocked, since browsers
 * only allow a popup while the click is recent.
 */

const MODULE_URL = "https://news.google.com/swg/js/v1/publisher.mjs";

interface PreferredSourceClient {
  init(options: { theme?: "light" | "dark"; lang?: string }): void;
  addPreferredSource(): void;
}

let client: PreferredSourceClient | null = null;
let loading: Promise<PreferredSourceClient | null> | null = null;

function load(): Promise<PreferredSourceClient | null> {
  loading ??= import(/* @vite-ignore */ MODULE_URL)
    .then((mod: { preferredSource: PreferredSourceClient }) => {
      const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      mod.preferredSource.init({ theme, lang: "en" });
      client = mod.preferredSource;
      return client;
    })
    .catch(() => {
      // Leave `loading` set: the deep link keeps working, and retrying on every
      // hover would only repeat a failing request.
      return null;
    });
  return loading;
}

/** Wires every `[data-preferred-source]` link on the page; safe to call more than once. */
export function bindPreferredSourceLinks(): void {
  for (const link of document.querySelectorAll<HTMLAnchorElement>("a[data-preferred-source]")) {
    if (link.dataset.preferredSourceBound) continue;
    link.dataset.preferredSourceBound = "true";

    const warm = () => void load();
    link.addEventListener("pointerenter", warm, { once: true });
    link.addEventListener("focus", warm, { once: true });
    link.addEventListener("touchstart", warm, { once: true, passive: true });

    link.addEventListener("click", (event) => {
      if (!client) return; // Not ready: let the deep link open.
      event.preventDefault();
      client.addPreferredSource();
    });
  }
}

/** Google's deep link for a site, e.g. https://www.google.com/preferences/source?q=gopocket.in */
export function preferredSourceUrl(site: URL): string {
  return `https://www.google.com/preferences/source?q=${encodeURIComponent(site.hostname.replace(/^www\./, ""))}`;
}
