import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

const polyfillCode = `if (typeof globalThis.MessageChannel === 'undefined') {
  globalThis.MessageChannel = class MessageChannel {
    constructor() {
      let p1, p2;
      this.port1 = p1 = { onmessage: null, postMessage: (d) => { if (p2.onmessage) p2.onmessage({ data: d }); } };
      this.port2 = p2 = { onmessage: null, postMessage: (d) => { if (p1.onmessage) p1.onmessage({ data: d }); } };
    }
  };
}`;

export default defineConfig({
  site: "https://gopocket.in",
  output: "server",
  adapter: cloudflare(),
  trailingSlash: "never",
  integrations: [react()],
  vite: {
    plugins: [
      {
        name: "polyfill-message-channel",
        renderChunk(code) {
          return polyfillCode + "\n" + code;
        }
      },
      tailwindcss()
    ]
  }
});
