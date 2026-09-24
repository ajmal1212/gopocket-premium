/**
 * Browser half of Cloudflare Turnstile - pairs with <TurnstileWidget /> on the
 * page and verifyTurnstile() in the endpoint (see turnstile.ts).
 *
 *   const captcha = mountTurnstile(form);
 *   // on submit: send captcha.getToken() as `turnstileToken`
 *   // after every response, success or not: captcha.reset()
 *
 * Tokens are single-use and expire after five minutes, which is why reset()
 * has to follow every submit - a retry after an error needs a fresh one.
 *
 * Cloudflare's script is injected here, only on pages that mount a widget,
 * instead of being linked from the layout; it is ~40 kB the rest of the site
 * never needs.
 */

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loader: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile did not initialise")),
    );
    script.addEventListener("error", () => reject(new Error("Turnstile script failed to load")));
    document.head.appendChild(script);
  });
  // Let a later mount retry after a failed load (a flaky connection, say).
  loader.catch(() => (loader = null));
  return loader;
}

export interface TurnstileHandle {
  /** The current token, or "" until the check has passed. */
  getToken(): string;
  /** Discard the spent token and run a fresh check. */
  reset(): void;
}

/** Renders the [data-turnstile] slot inside `root` (usually the form). */
export function mountTurnstile(root: ParentNode): TurnstileHandle {
  const container = root.querySelector<HTMLElement>("[data-turnstile]");
  let token = "";
  let widgetId: string | null = null;

  if (container?.dataset.sitekey) {
    loadTurnstile()
      .then((turnstile) => {
        widgetId = turnstile.render(container, {
          sitekey: container.dataset.sitekey,
          action: container.dataset.action,
          // "auto" would follow the OS, not the site's own theme toggle.
          theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
          size: "flexible",
          // Set by <TurnstileWidget appearance>: "interaction-only" stays hidden
          // unless the visitor has to be challenged.
          appearance: container.dataset.appearance || "always",
          // The token is read through getToken(); no hidden input needed.
          "response-field": false,
          callback: (value: string) => (token = value),
          "expired-callback": () => (token = ""),
          "error-callback": () => {
            token = "";
          },
        });
      })
      .catch(() => {
        container.textContent = "Verification could not load. Please refresh the page and try again.";
        container.classList.add("text-sm", "text-rose-600");
      });
  }

  return {
    getToken: () => token,
    reset() {
      token = "";
      if (widgetId !== null) window.turnstile?.reset(widgetId);
    },
  };
}
