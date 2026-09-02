import type { APIRoute } from "astro";
import { createLead } from "../../lib/frappe";

/**
 * Lead capture for the open-account call-back form.
 *
 * The browser posts here rather than to Frappe directly: the API token is a
 * server-side secret, and a client-side SDK call would ship it to every visitor
 * in the page bundle.
 *
 * On success the response carries the `redirect` the page should send the
 * visitor to, derived from the status Frappe returns:
 *   client       -> already onboarded, go to the trading terminal
 *   kyc          -> mid-signup, go back to the signup flow
 *   lead_created -> new lead, start the signup flow
 */

const WEB_URL = "https://web.gopocket.in";
const SIGNUP_URL = "https://signup.gopocket.in/";

interface Payload {
  mobile?: unknown;
  refer?: unknown;
  src?: unknown;
  tag?: unknown;
}

interface ResponseBody {
  ok: boolean;
  title: string;
  message: string;
  status?: string;
  lead?: string;
  redirect?: string;
}

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/**
 * Reduces a submitted number to bare digits and drops a country code or STD
 * prefix if one came along with it.
 *
 * The prefix strip is guarded on length: an unconditional `^\+?91` would eat
 * the first two digits of a perfectly valid 10-digit number that happens to
 * start 91, and turn it into an 8-digit rejection.
 */
function normaliseMobile(value: unknown): string {
  let digits = asText(value).replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

/** `refer` is only appended when the visitor actually arrived with one. */
function signupUrl(refer: string): string {
  return refer ? `${SIGNUP_URL}?refer=${encodeURIComponent(refer)}` : SIGNUP_URL;
}

function json(body: ResponseBody, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return json(
      {
        ok: false,
        title: "Something went wrong",
        message: "We could not read your details. Please try again.",
      },
      400,
    );
  }

  const mobile = normaliseMobile(payload.mobile);
  const refer = asText(payload.refer);
  const src = asText(payload.src);
  const tag = asText(payload.tag);

  if (!/^[0-9]{10}$/.test(mobile)) {
    return json(
      {
        ok: false,
        title: "Check your details",
        message: "Please enter a valid 10-digit mobile number.",
      },
      400,
    );
  }

  const result = await createLead({ mobile, refer, src, tag });

  if (!result.ok) {
    return json({ ok: false, title: "Something went wrong", message: result.message }, 502);
  }

  const { status, message, lead } = result.data;

  switch (status) {
    case "client":
      return json(
        {
          ok: true,
          status,
          title: "Welcome back!",
          message: message || "You already have an account. Taking you to your dashboard...",
          redirect: WEB_URL,
        },
        200,
      );
    case "kyc":
      return json(
        {
          ok: true,
          status,
          title: "Let's finish your KYC",
          message: message || "Your signup is in progress. Taking you to the next step...",
          redirect: signupUrl(refer),
        },
        200,
      );
    case "lead_created":
      return json(
        {
          ok: true,
          status,
          lead,
          title: "You're all set!",
          message: message || "Taking you to the signup form...",
          redirect: signupUrl(refer),
        },
        200,
      );
    default:
      // An unrecognised status is not something the page can route on, so it
      // surfaces as an error rather than a silent redirect to the wrong place.
      console.error("create_lead returned an unhandled status:", status, message);
      return json(
        {
          ok: false,
          title: "Something went wrong",
          message: message || "We could not process your request. Please try again.",
        },
        502,
      );
  }
};
