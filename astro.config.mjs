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
  // Dev only - the toolbar is never shipped. Its Audit app re-runs on every DOM
  // change and fetch()es every <img> on the page each time to check its size,
  // and live prices change the DOM several times a second: the Network panel
  // filled with the same images, over and over. Set to true to bring it back.
  devToolbar: { enabled: false },
  integrations: [react()],
  vite: {
    plugins: [
      {
        name: "polyfill-message-channel",
        renderChunk(code) {
          return polyfillCode + "\n" + code;
        },
      },
      tailwindcss(),
    ],
  },
});
