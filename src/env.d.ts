/// <reference types="astro/client" />

// The package's "types" points at a dist/index.d.ts it does not ship.
declare module "@n8n/chat" {
  export function createChat(options: Record<string, unknown>): unknown;
}
