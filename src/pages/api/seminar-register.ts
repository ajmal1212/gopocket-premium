import type { APIRoute } from "astro";
import { addSeminarRegistration } from "../../lib/frappe";

/**
 * Seminar registration runs through this endpoint rather than calling Frappe
 * from the browser: the API token is a server-side secret, and a client-side
 * SDK call would ship it to every visitor in the page bundle.
 *
 * Every response carries a `title` and `message`, which the page renders as the
 * two lines of a toast.
 */

interface Payload {
  seminar?: unknown;
  fullName?: unknown;
  mobile?: unknown;
  city?: unknown;
  clientCode?: unknown;
}

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function json(
  body: { ok: boolean; title: string; message: string },
  status: number,
): Response {
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
  // Strip spaces, dashes and a +91 prefix before validating, so a correctly
  // typed number is not rejected over formatting.
  const mobile = asText(payload.mobile).replace(/[\s-]/g, "").replace(/^\+?91/, "");

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

  const result = await addSeminarRegistration(seminar, {
    mobile_number: mobile,
    full_name: fullName,
    client_name: fullName,
    city,
    client_code: clientCode || "New",
    mode: "Website",
  });

  switch (result.status) {
    case "ok":
      return json(
        {
          ok: true,
          title: "Registration Successful!",
          message:
            "Thank you for registering. We have sent the webinar joining link to your registered mobile number.",
        },
        200,
      );
    case "duplicate":
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
