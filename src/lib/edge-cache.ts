/**
 * Cloudflare's cache for one data centre, shared by every copy of the worker
 * running there.
 *
 * A module-level Map lives in one isolate, and Cloudflare spreads requests
 * over many - on a site with modest traffic the next visitor rarely lands on
 * the isolate that did the work. This cache is shared by all of them. Values
 * are stored as JSON under a made-up URL, which is all the Cache API needs as
 * a key.
 *
 * It works on a Cloudflare zone - the site's own domain - and is a no-op on a
 * workers.dev address and under `astro dev`, where there is no `caches.default`
 * at all. Both calls then quietly do nothing, so callers keep their in-memory
 * cache in front of this one.
 */

const KEY_ORIGIN = "https://edge-cache.gopocket.internal/";

function store(): Cache | null {
  const storage = (globalThis as { caches?: { default?: Cache } }).caches;
  return storage?.default ?? null;
}

export async function edgeGet<T>(key: string): Promise<T | undefined> {
  const cache = store();
  if (!cache) return undefined;
  try {
    const hit = await cache.match(KEY_ORIGIN + encodeURIComponent(key));
    return hit ? ((await hit.json()) as T) : undefined;
  } catch {
    return undefined;
  }
}

export async function edgePut(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const cache = store();
  if (!cache) return;
  try {
    await cache.put(
      KEY_ORIGIN + encodeURIComponent(key),
      new Response(JSON.stringify(value), {
        headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${Math.round(ttlSeconds)}` },
      }),
    );
  } catch {
    // A cache that can't be written only means a slower next page.
  }
}

/* ---------------------------------------------------------------------------
   Stale-while-revalidate
   ------------------------------------------------------------------------ */

interface Stamped<T> {
  value: T;
  /** Epoch ms the value was loaded. */
  at: number;
}

export interface SwrOptions<T> {
  /** Served as-is, no refresh, for this many seconds after loading. */
  freshSeconds: number;
  /**
   * After that and up to this age, served at once while a refresh runs in the
   * background for the next request. Past it, the request waits for a new load.
   */
  staleSeconds: number;
  /** Whether a loaded value is good enough to keep; default: anything but null. */
  keep?: (value: T) => boolean;
  /**
   * The Worker's `ctx.waitUntil`, which keeps the isolate alive for the
   * background refresh after the response has gone. Without it (astro dev)
   * the refresh still runs, it just isn't guaranteed to finish.
   */
  waitUntil?: (promise: Promise<unknown>) => void;
}

/** Per-isolate copies, in front of the edge cache. Bounded, stalest dropped first. */
const SWR_LIMIT = 500;
const swrLocal = new Map<string, Stamped<unknown>>();
/**
 * When each key's background refresh started, so a burst of requests on a
 * stale key refreshes it once rather than once each. A timestamp, not the
 * refresh's promise: a Worker must not await a promise that belongs to another
 * request - Cloudflare warns, and the waiting request can hang.
 */
const swrRefreshing = new Map<string, number>();
const REFRESH_GRACE_MS = 15_000;

function keepLocal(key: string, entry: Stamped<unknown>) {
  swrLocal.delete(key);
  swrLocal.set(key, entry);
  if (swrLocal.size > SWR_LIMIT) swrLocal.delete(swrLocal.keys().next().value!);
}

/**
 * Stale-while-revalidate over this isolate and the data centre's cache.
 *
 * HTTP's `stale-while-revalidate` directive can't do this job: browsers honour
 * it for subresources only, never for the page itself, and the page is what
 * carries the data. So the same idea runs here, on the data behind the page:
 * a value past its fresh window but inside its stale one is returned at once,
 * and the reload happens after the response has gone, via `waitUntil`. Only a
 * value older than the stale window, or none at all, makes a visitor wait.
 *
 * A load that fails (null) or isn't worth keeping never replaces a good value,
 * so an upstream outage serves the last good answer until it goes stale.
 */
export async function swr<T>(key: string, load: () => Promise<T | null>, options: SwrOptions<T>): Promise<T | null> {
  const { freshSeconds, staleSeconds, keep = () => true, waitUntil } = options;

  const refresh = async (): Promise<T | null> => {
    const value = await load();
    if (value === null || !keep(value)) return value;
    const entry = { value, at: Date.now() };
    keepLocal(key, entry);
    await edgePut(`swr:${key}`, entry, staleSeconds);
    return value;
  };

  const entry = (swrLocal.get(key) as Stamped<T> | undefined) ?? (await edgeGet<Stamped<T>>(`swr:${key}`));
  const age = entry ? (Date.now() - entry.at) / 1000 : Infinity;

  if (entry && age < freshSeconds) {
    keepLocal(key, entry);
    return entry.value;
  }
  if (entry && age < staleSeconds) {
    keepLocal(key, entry);
    const started = swrRefreshing.get(key);
    if (!started || Date.now() - started > REFRESH_GRACE_MS) {
      swrRefreshing.set(key, Date.now());
      const background = refresh()
        .catch(() => null)
        .finally(() => swrRefreshing.delete(key));
      waitUntil?.(background);
    }
    return entry.value;
  }
  return refresh();
}
