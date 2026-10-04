import { isResendConfigured, sendEmail } from "@/lib/resend/client";
import { resolveFormEmail } from "@/lib/forms/email-config";
import {
  EMAIL_RE,
  escapeHtml,
  getClientIp,
  isHoneypotTriggered,
  createRateLimiter,
} from "@/lib/forms/shared";
import { ORDER_SIZE_VALUES, PRODUCT_OPTIONS } from "@/lib/gifting/constants";
import type { ProductOption } from "@/lib/gifting/constants";

// Never cache/prerender — same as /api/contact, see that route's comment.
export const dynamic = "force-dynamic";

const PHONE_RE = /^[0-9+()\-.\s]{7,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_MESSAGE_LENGTH = 5000;

// Same shared limiter shape as /api/contact, but its own independent
// bucket map/instance — a burst on one form doesn't spend the other's
// budget.
const checkRateLimit = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

interface GiftingPayload {
  firstName?: unknown;
  lastName?: unknown;
  companyName?: unknown;
  email?: unknown;
  phone?: unknown;
  orderSize?: unknown;
  products?: unknown;
  timeline?: unknown;
  message?: unknown;
  /** Honeypot — see GiftingForm.tsx's hidden `website` input, same
   * pattern as ContactForm.tsx/`/api/contact`. */
  website?: unknown;
}

/** Drops anything that isn't one of the known product options rather than
 * rejecting the whole request — a stale client build or a tampered
 * request shouldn't 400 over an extra/misspelled value here. */
function normalizeProducts(value: unknown): ProductOption[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is ProductOption =>
    (PRODUCT_OPTIONS as readonly string[]).includes(v)
  );
}

export async function POST(request: Request) {
  let body: GiftingPayload;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Bot caught by the honeypot: fake success, no email sent — see
  // isHoneypotTriggered's own comment on why this isn't a real error.
  if (isHoneypotTriggered(body.website)) {
    return Response.json({ success: true });
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const orderSize = typeof body.orderSize === "string" ? body.orderSize.trim() : "";
  const products = normalizeProducts(body.products);
  const timeline = typeof body.timeline === "string" ? body.timeline.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  // Same validation the client already runs (GiftingForm.tsx) — never
  // trust the client alone, a request can always bypass it. Company,
  // products, and timeline are the form's optional fields (see
  // GiftingForm's own doc comment on that judgment call).
  if (!firstName) {
    return Response.json({ error: "Enter your first name." }, { status: 400 });
  }
  if (!lastName) {
    return Response.json({ error: "Enter your last name." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!PHONE_RE.test(phone)) {
    return Response.json({ error: "Enter a valid phone number." }, { status: 400 });
  }
  if (!ORDER_SIZE_VALUES.includes(orderSize as (typeof ORDER_SIZE_VALUES)[number])) {
    return Response.json({ error: "Select an estimated order size." }, { status: 400 });
  }
  if (timeline && !DATE_RE.test(timeline)) {
    return Response.json({ error: "Enter a valid timeline date." }, { status: 400 });
  }
  if (!message) {
    return Response.json(
      { error: "Tell us a bit about what you're thinking." },
      { status: 400 }
    );
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).` },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(ip || "unknown")) {
    return Response.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  if (!isResendConfigured()) {
    console.error("[gifting] RESEND_API_KEY is not set — see .env.example.");
    return Response.json(
      { error: "This form isn't set up yet. Please email us directly in the meantime." },
      { status: 500 }
    );
  }

  const emailConfig = resolveFormEmail("gifting", {
    to: "GIFTING_TO_EMAIL",
    from: "GIFTING_FROM_EMAIL",
  });
  if ("errorResponse" in emailConfig) return emailConfig.errorResponse;

  const fullName = `${firstName} ${lastName}`;
  const rows: Array<[string, string]> = [
    ["Name", fullName],
    ["Company", companyName || "—"],
    ["Email", email],
    ["Phone", phone],
    ["Estimated order size", orderSize],
    ["Products", products.length > 0 ? products.join(", ") : "—"],
    ["Timeline", timeline || "—"],
  ];

  try {
    const sent = await sendEmail({
      to: emailConfig.to,
      from: emailConfig.from,
      replyTo: email,
      subject: `New gifting inquiry from ${fullName}`,
      text:
        rows.map(([label, value]) => `${label}: ${value}`).join("\n") +
        `\n\nMessage:\n${message}`,
      html:
        `<table cellpadding="4" cellspacing="0">` +
        rows
          .map(
            ([label, value]) =>
              `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`
          )
          .join("") +
        `</table>` +
        `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    });
    // Resend's own message id — logged, not returned to the submitter;
    // matches /api/contact's own logging.
    console.log(`[gifting] sent, Resend message id: ${sent.id}`);
    return Response.json({ success: true });
  } catch (error) {
    // Real cause (bad/expired API key, unverified domain, rate limit,
    // network failure) goes to the server log only — see /api/contact's
    // own comment on why nothing from it is safe to show a submitter.
    console.error("[gifting] sendEmail failed:", error);
    return Response.json(
      { error: "We couldn't send your inquiry right now. Please try again in a moment." },
      { status: 502 }
    );
  }
}
