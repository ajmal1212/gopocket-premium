/**
 * Server-side Cloudflare Turnstile verification, shared by every form endpoint.
 *
 * The widget in the browser only produces a token; nothing is proven until the
 * server trades that token for a verdict at siteverify. Without this check a bot
 * can skip the page entirely and POST straight to the endpoint.
 *
 * Usage in an endpoint (after the cheap field validation, so a typo does not
 * burn the visitor's single-use token):
 *
 *   const check = await verifyTurnstile({ token, action: "seminar-register", request, env: locals.runtime?.env });
 *   if (!check.ok) return json({ ok: false, title: check.title, message: check.message }, check.status);
 *
 * The page side is <TurnstileWidget action="..." /> plus mountTurnstile() from
 * turnstile-client.ts. The action string must match on both sides.
 *
 * Keys come from the Worker environment at request time, never import.meta.env,
 * so the secret is never inlined into the build output:
 *   TURNSTILE_SITE_KEY   - public, in wrangler.jsonc "vars"
 *   TURNSTILE_SECRET_KEY - `wrangler secret put TURNSTILE_SECRET_KEY`
 * For `astro dev`, .dev.vars holds Cloudflare's always-pass test keys, since the
 * real site key does not render on localhost.
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface SiteverifyResponse {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
  action?: string;
  metadata?: { result_with_testing_key?: boolean };
}

export type TurnstileResult =
  | { ok: true }
  | {
      ok: false;
      status: number;
      title: string;
      message: string;
    };

interface VerifyOptions {
  /** The token the widget handed the page, as posted by the form. */
  token: unknown;
  /** Must equal the widget's data-action, so a token from another form is refused. */
  action: string;
  request: Request;
  env: Partial<Env> | undefined;
}

function fail(status: number, title: string, message: string): TurnstileResult {
  return { ok: false, status, title, message };
}

export async function verifyTurnstile({ token, action, request, env }: VerifyOptions): Promise<TurnstileResult> {
  const secret = env?.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Fail closed: a missing secret must never mean "let everyone through".
    console.error("TURNSTILE_SECRET_KEY is not set; rejecting the submission.");
    return fail(500, "Something went wrong", "Verification is unavailable right now. Please try again later.");
  }

  if (typeof token !== "string" || !token) {
    return fail(400, "Verification needed", "Please complete the verification check and try again.");
  }

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) body.append("remoteip", ip);

  let result: SiteverifyResponse;
  try {
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(5000) });
    result = (await res.json()) as SiteverifyResponse;
  } catch (error) {
    // Also fail closed if Cloudflare cannot be reached - otherwise an outage
    // is an open door.
    console.error("Turnstile siteverify request failed:", error);
    return fail(503, "Verification unavailable", "We could not verify your request. Please try again in a moment.");
  }

  if (!result.success) {
    if (result["error-codes"]?.includes("timeout-or-duplicate")) {
      return fail(400, "Verification expired", "Your verification expired. Please complete the check again.");
    }
    return fail(403, "Verification failed", "We could not verify your request. Please complete the check again.");
  }

  // Cloudflare's test keys pass any token and report hostname "example.com"
  // with no action. Fine for `astro dev`; in a production build it means the
  // test secret was deployed by mistake, which would wave every bot through.
  if (result.metadata?.result_with_testing_key) {
    if (import.meta.env.PROD) {
      console.error("Turnstile answered with a testing key in production; rejecting the submission.");
      return fail(500, "Something went wrong", "Verification is unavailable right now. Please try again later.");
    }
    return { ok: true };
  }

  // The token must have been issued for this site and this form.
  if (result.hostname !== new URL(request.url).hostname || result.action !== action) {
    return fail(403, "Verification failed", "We could not verify your request. Please complete the check again.");
  }

  return { ok: true };
}
