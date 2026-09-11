/// <reference types="astro/client" />

declare module "smoothscroll-for-websites" {
  export default function SmoothScroll(options?: any): void;
}

// The package's "types" points at a dist/index.d.ts it does not ship.
declare module "@n8n/chat" {
  export function createChat(options: Record<string, unknown>): unknown;
}
