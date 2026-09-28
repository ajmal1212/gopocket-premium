import type { APIRoute } from "astro";
import { addSeminarRegistration } from "../../lib/frappe";
import { verifyTurnstile } from "../../lib/turnstile";

/**
 * Seminar registration runs through this endpoint rather than calling Frappe
 * from the browser: the API token is a server-side secret, and a client-side
 * SDK call would ship it to every visitor in the page bundle.
 *
 * Every response carries a `title` and `message`, which the page renders as the
 * two lines of a toast. A successful one may also carry `classLink`, the
 * attendee's own joining link, in which case the page redirects there instead.
 */

interface Payload {
  seminar?: unknown;
  fullName?: unknown;
  mobile?: unknown;
  city?: unknown;
  clientCode?: unknown;
  refer?: unknown;
  mode?: unknown;
  turnstileToken?: unknown;
}

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function json(body: { ok: boolean; title: string; message: string; classLink?: string }, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function invalid(message: string): Response {
  return json({ ok: false, title: "Check your details", message }, 400);
}

export const POST: APIRoute = async ({ request, locals }) => {
  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return json(
      {
        ok: false,
        title: "Something went wrong",
        message: "We could not read your registration details. Please try again.",
      },
      400,
    );
  }

  const seminar = asText(payload.seminar);
  const fullName = asText(payload.fullName);
  const city = asText(payload.city);
  const clientCode = asText(payload.clientCode);
  // Both come straight from a shareable URL, so cap them rather than store
  // whatever length someone pastes in.
  const refer = asText(payload.refer).slice(0, 40);
  const mode = asText(payload.mode).slice(0, 40);
  // Strip spaces, dashes and a +91 prefix before validating, so a correctly
  // typed number is not rejected over formatting.
  const mobile = asText(payload.mobile)
    .replace(/[\s-]/g, "")
    .replace(/^\+?91/, "");

  if (!seminar) {
    return json(
      {
        ok: false,
        title: "Seminar unavailable",
        message: "This seminar is no longer open for registration.",
      },
      400,
    );
  }
  if (!fullName) return invalid("Please enter your full name.");
  if (!/^[0-9]{10}$/.test(mobile)) return invalid("Please enter a valid 10-digit mobile number.");
  if (!city) return invalid("Please enter your city.");

  // After the field checks, so a typo does not spend the single-use token.
  const check = await verifyTurnstile({
    token: payload.turnstileToken,
    action: "seminar-register",
    request,
    env: locals.runtime?.env,
  });
  if (!check.ok) return json({ ok: false, title: check.title, message: check.message }, check.status);

  const result = await addSeminarRegistration(seminar, {
    mobile_number: mobile,
    full_name: fullName,
    client_name: fullName,
    city,
    client_code: clientCode || "New",
    // A referral link's ?mode= names the channel (Instagram, WhatsApp...);
    // anything else is a plain website sign-up.
    mode: mode || "Website",
    ...(refer && { refer }),
  });

  switch (result.status) {
    case "ok":
      // With a class link the page forwards the visitor straight to it; the
      // title and message are only shown when the link was not ready in time.
      return json(
        {
          ok: true,
          title: "Registration Successful!",
          message: "Thank you for registering. We have sent the webinar joining link to your registered mobile number.",
          ...(result.classLink && { classLink: result.classLink }),
        },
        200,
      );
    case "duplicate":
      // Already registered for this seminar: treat it as a success and send
      // them to the link from their first registration. `ok: true` is what
      // makes the page open it.
      if (result.classLink) {
        return json(
          {
            ok: true,
            title: "Already registered",
            message: "You are already registered for this session.",
            classLink: result.classLink,
          },
          200,
        );
      }
      return json(
        {
          ok: false,
          title: "Already registered",
          message: "This mobile number is already registered. We will see you at the session.",
        },
        409,
      );
    case "not_found":
      return json(
        {
          ok: false,
          title: "Seminar unavailable",
          message: "This seminar is no longer open for registration.",
        },
        404,
      );
    default:
      return json({ ok: false, title: "Registration failed", message: result.message }, 502);
  }
};
