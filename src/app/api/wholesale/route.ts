import { isResendConfigured, sendEmail } from "@/lib/resend/client";
import { resolveFormEmail } from "@/lib/forms/email-config";
import {
  EMAIL_RE,
  escapeHtml,
  getClientIp,
  isHoneypotTriggered,
  createRateLimiter,
} from "@/lib/forms/shared";
import { BUSINESS_TYPE_OPTIONS } from "@/lib/wholesale/constants";

// Never cache/prerender — same as /api/contact and /api/gifting.
export const dynamic = "force-dynamic";

const PHONE_RE = /^[0-9+()\-.\s]{7,20}$/;
const MAX_FIELD_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;

// Own bucket, independent of the contact/gifting limiters.
const checkRateLimit = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

interface WholesalePayload {
  firstName?: unknown;
  lastName?: unknown;
  businessName?: unknown;
  email?: unknown;
  phone?: unknown;
  businessType?: unknown;
  location?: unknown;
  storeUrl?: unknown;
  message?: unknown;
  /** Honeypot — see WholesaleForm.tsx's hidden `website` input. */
  website?: unknown;
}

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export async function POST(request: Request) {
  let body: WholesalePayload;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (isHoneypotTriggered(body.website)) {
    return Response.json({ success: true });
  }

  const firstName = str(body.firstName);
  const lastName = str(body.lastName);
  const businessName = str(body.businessName);
  const email = str(body.email);
  const phone = str(body.phone);
  const businessType = str(body.businessType);
  const location = str(body.location);
  const storeUrl = str(body.storeUrl);
  const message = str(body.message);

  // Mirrors WholesaleForm's clientError — never trust the client alone.
  if (!firstName) return Response.json({ error: "Enter your first name." }, { status: 400 });
  if (!lastName) return Response.json({ error: "Enter your last name." }, { status: 400 });
  if (!businessName) return Response.json({ error: "Enter your business name." }, { status: 400 });
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (phone && !PHONE_RE.test(phone)) {
    return Response.json({ error: "Enter a valid phone number." }, { status: 400 });
  }
  if (!(BUSINESS_TYPE_OPTIONS as readonly string[]).includes(businessType)) {
    return Response.json({ error: "Select your type of business." }, { status: 400 });
  }
  if (!location) return Response.json({ error: "Enter your city and state." }, { status: 400 });
  if (
    [firstName, lastName, businessName, location, storeUrl].some((v) => v.length > MAX_FIELD_LENGTH)
  ) {
    return Response.json({ error: "One of the fields is too long." }, { status: 400 });
  }
  if (!message) {
    return Response.json({ error: "Tell us a bit about what you're looking for." }, { status: 400 });
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
    console.error("[wholesale] RESEND_API_KEY is not set — see .env.example.");
    return Response.json(
      { error: "This form isn't set up yet. Please email us directly in the meantime." },
      { status: 500 }
    );
  }

  const emailConfig = resolveFormEmail("wholesale", {
    to: "WHOLESALE_TO_EMAIL",
    from: "WHOLESALE_FROM_EMAIL",
  });
  if ("errorResponse" in emailConfig) return emailConfig.errorResponse;

  const fullName = `${firstName} ${lastName}`;
  const rows: Array<[string, string]> = [
    ["Name", fullName],
    ["Business", businessName],
    ["Business type", businessType],
    ["Location", location],
    ["Website / Instagram", storeUrl || "—"],
    ["Email", email],
    ["Phone", phone || "—"],
  ];

  try {
    const sent = await sendEmail({
      to: emailConfig.to,
      from: emailConfig.from,
      replyTo: email,
      subject: `New wholesale inquiry from ${businessName}`,
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
    console.log(`[wholesale] sent, Resend message id: ${sent.id}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error("[wholesale] sendEmail failed:", error);
    return Response.json(
      { error: "We couldn't send your inquiry right now. Please try again in a moment." },
      { status: 502 }
    );
  }
}
