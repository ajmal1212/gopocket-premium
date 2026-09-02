import type { APIRoute } from "astro";
import { createLead } from "../../lib/frappe";

/**
 * Partner enquiries from /partner-with-us.
 *
 * Separate from /api/create-lead for two reasons: this form collects a name,
 * email and state alongside the number, and a partner applicant must NOT be
 * bounced into the retail signup flow afterwards. The reply carries no
 * `redirect`, so the page shows a toast, clears the form and stays put.
 *
 * KNOWN GAP: `gopocket.website.create_lead` accepts only mobile, refer, src and
 * tag. The name, email and state are validated here and then dropped, so today
 * a partner enquiry reaches the CRM as a lead tagged "Partner" carrying the
 * mobile number alone - enough for the team to call back, but not the full
 * application. Point `submitPartnerEnquiry` below at a partner endpoint (or
 * extend create_lead to take the extra fields) and the rest flows through.
 */

const DEFAULT_TAG = "Partner";
const DEFAULT_SRC = "Website";

interface Payload {
  name?: unknown;
  mobile?: unknown;
  email?: unknown;
  state?: unknown;
  refer?: unknown;
  src?: unknown;
  tag?: unknown;
}

interface ResponseBody {
  ok: boolean;
  title: string;
  message: string;
  lead?: string;
}

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/**
 * Reduces a submitted number to bare digits and drops a country code or STD
 * prefix if one came along with it. Guarded on length, so a valid 10-digit
 * number that happens to start 91 or 0 is left alone.
 */
function normaliseMobile(value: unknown): string {
  let digits = asText(value).replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

// Deliberately loose: enough to catch a typo, not so strict that it rejects a
// deliverable address. Real verification is the follow-up call's job.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
    return json(
      {
        ok: false,
        title: "Something went wrong",
        message: "We could not read your details. Please try again.",
      },
      400,
    );
  }

  const name = asText(payload.name);
  const email = asText(payload.email);
  const state = asText(payload.state);
  const mobile = normaliseMobile(payload.mobile);
  const refer = asText(payload.refer);
  const src = asText(payload.src) || DEFAULT_SRC;
  const tag = asText(payload.tag) || DEFAULT_TAG;

  if (!name) return invalid("Please enter your name.");
  if (!/^[0-9]{10}$/.test(mobile)) return invalid("Please enter a valid 10-digit mobile number.");
  if (!EMAIL_PATTERN.test(email)) return invalid("Please enter a valid email address.");
  if (!state) return invalid("Please select your state.");

  const result = await createLead({ mobile, refer, src, tag });

  if (!result.ok) {
    return json({ ok: false, title: "Something went wrong", message: result.message }, 502);
  }

  const { status, message, lead } = result.data;

  // Unlike the retail flow, none of the statuses route anywhere - a partner
  // applicant who already holds an account is still a valid applicant. Every
  // recognised status is a successful enquiry.
  if (status === "lead_created" || status === "kyc" || status === "client") {
    return json(
      {
        ok: true,
        lead,
        title: "Thanks for reaching out!",
        message: "Our partnership team will call you shortly to take this forward.",
      },
      200,
    );
  }

  console.error("partner enquiry: unhandled create_lead status:", status, message);
  return json(
    {
      ok: false,
      title: "Something went wrong",
      message: message || "We could not process your request. Please try again.",
    },
    502,
  );
};
