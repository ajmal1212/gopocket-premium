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
