/**
 * Where the feed hub lives.
 *
 * Both values are resolved at BUILD time, not at request time: Vite replaces
 * `import.meta.env.*` with literals while bundling. So a variable set on the
 * Worker in the Cloudflare dashboard never reaches this code - the build had
 * already happened - and a fallback here is what production actually runs on.
 * That is why the fallbacks are the public hostname and never a LAN address: a
 * build without a .env (Cloudflare's builds clone the repo, and .env is
 * gitignored) must still produce a working site. Set either variable in .env,
 * or as a Build variable in the Cloudflare dashboard, to point elsewhere.
 */

/** The hub's HTTP API, fetched while rendering. Server-side only. */
export const FEED_HUB_URL = import.meta.env.FEED_HUB_URL || "https://mktfeed.codenetic.online";

/**
 * The hub's socket, opened by the visitor's browser. `wss://` rather than
 * `ws://`: the site is served over HTTPS, and a browser refuses an insecure
 * socket from a secure page outright - the price would never go live.
 */
export const FEED_WS_URL = import.meta.env.PUBLIC_FEED_WS_URL || "wss://mktfeed.codenetic.online";
