import type { APIRoute } from "astro";

/**
 * "Refer directly" submissions from /refer-and-earn.
 *
 * The referrer leaves a friend's name, number and city, and the team follows
 * up and tags the friend under the referrer's code. The old Webflow page sent
 * this straight from the browser as a GET with every field in the path; the
 * same call is made here, server-side, for the CORS reason given in
 * refer-link.ts. The reply carries no `redirect`, so LeadCapture shows a toast,
 * clears the form and the visitor stays on the page.
 */

const REFER_DIRECT_ENDPOINT = "https://api2.gopocket.in/GoPocketRefer";
const DEFAULT_SRC = "Website";
const DEFAULT_TAG = "ReferEarn";

interface Payload {
  code?: unknown;
  name?: unknown;
  mobile?: unknown;
  city?: unknown;
  src?: unknown;
  tag?: unknown;
}

interface ResponseBody {
  ok: boolean;
  title: string;
  message: string;
}

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/** Same prefix handling as the partner enquiry: drop a +91 or 0 in front. */
function normaliseMobile(value: unknown): string {
  let digits = asText(value).replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

function json(body: ResponseBody, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function invalid(message: string): Response {
  return json({ ok: false, title: "Check your details", message }, 400);
}

export const POST: APIRoute = async ({ request }) => {
  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return invalid("We could not read your details. Please try again.");
  }

  const code = asText(payload.code).toUpperCase();
  const name = asText(payload.name);
  const mobile = normaliseMobile(payload.mobile);
  const city = asText(payload.city);
  const src = asText(payload.src) || DEFAULT_SRC;
  const tag = asText(payload.tag) || DEFAULT_TAG;

  // The old form left the referrer's code optional, but every field lands in a
  // path segment, so an empty one collapses the URL. Without the code there is
  // also nobody to credit the referral to.
  if (!/^[A-Z0-9_-]{2,20}$/.test(code)) return invalid("Please enter your client or AP code.");
  if (!name) return invalid("Please enter your friend's name.");
  if (!/^[0-9]{10}$/.test(mobile)) return invalid("Please enter a valid 10-digit mobile number.");
  if (!city) return invalid("Please enter your friend's city.");

  // The `_` prefixes on src and tag are the format the old page used.
  const segments = [code, name, mobile, city, "DIRECTREFER", `_${src}`, `_${tag}`].map(encodeURIComponent);

  try {
    const res = await fetch(`${REFER_DIRECT_ENDPOINT}/${segments.join("/")}`, {
      headers: { Accept: "application/json;charset=utf-8" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (error) {
    console.error("refer direct: request failed:", error);
    return json(
      { ok: false, title: "Something went wrong", message: "We could not send your referral. Please try again." },
      502,
    );
  }

  return json(
    {
      ok: true,
      title: "Referral received!",
      message: "We will reach out to your friend and add them under your code.",
    },
    200,
  );
};
