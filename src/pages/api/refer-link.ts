import type { APIRoute } from "astro";

/**
 * Referral link generator for /refer-and-earn.
 *
 * Proxies the back-office lookup the old Webflow page called straight from the
 * browser. That page lived on www.gopocket.in; this site serves the apex
 * domain, so a direct call would depend on the back office's CORS list.
 * Calling it server-side takes that dependency out of the picture.
 *
 * The back office answers `{ status: 1, reason: "<link>" }` for a known client
 * or AP code and `{ status: 0, reason: "Not Found" }` otherwise.
 */

const REFER_LINK_ENDPOINT = "https://services.gopocket.in/BackOffice/GetReferLink";

interface ResponseBody {
  ok: boolean;
  title: string;
  message: string;
  link?: string;
}

interface BackOfficeReply {
  status?: unknown;
  reason?: unknown;
}

function json(body: ResponseBody, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let code = "";
  try {
    const payload = (await request.json()) as { code?: unknown };
    code = typeof payload.code === "string" ? payload.code.trim().toUpperCase() : "";
  } catch {
    // Falls through to the empty-code check below.
  }

  // Client and AP codes are short alphanumerics; anything else is a typo, and
  // there is no reason to forward it.
  if (!/^[A-Z0-9_-]{2,20}$/.test(code)) {
    return json({ ok: false, title: "Check your code", message: "Please enter a valid client or AP code." }, 400);
  }

  let reply: BackOfficeReply;
  try {
    const res = await fetch(REFER_LINK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: code }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    reply = (await res.json()) as BackOfficeReply;
  } catch (error) {
    console.error("refer link: back office request failed:", error);
    return json(
      { ok: false, title: "Something went wrong", message: "We could not generate your link. Please try again." },
      502,
    );
  }

  if (reply.status === 1 && typeof reply.reason === "string" && reply.reason) {
    return json(
      { ok: true, title: "Your link is ready", message: "Copy it or share it below.", link: reply.reason },
      200,
    );
  }

  return json(
    {
      ok: false,
      title: "Code not found",
      message: "We could not find that client or AP code. Please check it and try again.",
    },
    404,
  );
};
