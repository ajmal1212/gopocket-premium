/// <reference types="astro/client" />

// The package's "types" points at a dist/index.d.ts it does not ship.
declare module "@n8n/chat" {
  export function createChat(options: Record<string, unknown>): unknown;
}

// Bindings the Worker receives at request time: "vars" from wrangler.json,
// secrets from `wrangler secret put`, and .dev.vars under `astro dev`.
interface Env {
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

interface Window {
  /** The page's Lenis smooth-scroll instance, set by GlobalScripts.astro. */
  lenis?: import("lenis").default;
}
