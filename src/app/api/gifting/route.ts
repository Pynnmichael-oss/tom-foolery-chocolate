import { isResendConfigured, sendEmail } from "@/lib/resend/client";
import { ORDER_SIZE_VALUES, PRODUCT_OPTIONS } from "@/lib/gifting/constants";
import type { ProductOption } from "@/lib/gifting/constants";

// Never cache/prerender — same as /api/contact, see that route's comment.
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-.\s]{7,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_MESSAGE_LENGTH = 5000;

// Same no-domain-yet flow as /api/contact — see that file's own comment
// for the full explanation. Separate GIFTING_* env vars (rather than
// reusing CONTACT_TO_EMAIL/CONTACT_FROM_EMAIL) so this form's routing can
// diverge from the Contact page's later (e.g. gifting inquiries to a
// sales inbox, general questions elsewhere) without the two entangling.
const DEFAULT_FROM = "Tom Foolery Website <onboarding@resend.dev>";
// TODO(garrett): this is TEMPORARY — pointed at Michael's inbox for testing
// while onboarding@resend.dev (no verified domain yet) can only deliver to
// the Resend account's own verified email, not garrett@tomfoolerychocolate.com.
// Switch this back to "garrett@tomfoolerychocolate.com" once
// tomfoolerychocolate.com (or a subdomain) is verified in Resend — see the
// setup notes in .env.example.
const DEFAULT_TO = "pynnmichael@outlook.com";

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
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

  if (!isResendConfigured()) {
    console.error("[gifting] RESEND_API_KEY is not set — see .env.example.");
    return Response.json(
      { error: "This form isn't set up yet. Please email us directly in the meantime." },
      { status: 500 }
    );
  }

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
    await sendEmail({
      to: process.env.GIFTING_TO_EMAIL || DEFAULT_TO,
      from: process.env.GIFTING_FROM_EMAIL || DEFAULT_FROM,
      replyTo: email,
      subject: `New corporate gifting inquiry from ${fullName}`,
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
