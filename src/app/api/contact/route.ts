import { isResendConfigured, sendEmail } from "@/lib/resend/client";
import { resolveFormEmail } from "@/lib/forms/email-config";
import {
  EMAIL_RE,
  escapeHtml,
  getClientIp,
  isHoneypotTriggered,
  createRateLimiter,
} from "@/lib/forms/shared";

// Never cache/prerender — this only ever runs in response to a real
// submission (see Route Handlers docs: POST isn't cached by default
// anyway, but stated explicitly since GET handlers elsewhere in this repo
// opt into caching and it's worth being unambiguous here).
export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 5000;

const checkRateLimit = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  /** Honeypot — see ContactForm.tsx's hidden `website` input. */
  website?: unknown;
}

export async function POST(request: Request) {
  let body: ContactPayload;
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  // Same validation the client already runs (ContactForm.tsx) — never
  // trust the client alone, a request can always bypass it.
  if (!name) {
    return Response.json({ error: "Enter your name." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!message) {
    return Response.json({ error: "Enter a message." }, { status: 400 });
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
    // Deliberately not thrown-and-caught below — this is a config problem
    // for the site owner, not a delivery failure, so it gets its own clear
    // server log line rather than being lumped in with ResendApiError.
    console.error("[contact] RESEND_API_KEY is not set — see .env.example.");
    return Response.json(
      { error: "The contact form isn't set up yet. Please email us directly in the meantime." },
      { status: 500 }
    );
  }

  const emailConfig = resolveFormEmail("contact", {
    to: "CONTACT_TO_EMAIL",
    from: "CONTACT_FROM_EMAIL",
  });
  if ("errorResponse" in emailConfig) return emailConfig.errorResponse;

  try {
    const sent = await sendEmail({
      to: emailConfig.to,
      from: emailConfig.from,
      replyTo: email,
      subject: `New contact form message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      html:
        `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>` +
        `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    });
    // Resend's own message id — logged, not returned to the submitter;
    // useful for looking a specific send up in the Resend dashboard if
    // someone reports never receiving a reply.
    console.log(`[contact] sent, Resend message id: ${sent.id}`);
    return Response.json({ success: true });
  } catch (error) {
    // Real cause (bad/expired API key, unverified domain, rate limit,
    // network failure — see ResendApiError.message/.cause) goes to the
    // server log only; nothing from it is safe to show a submitter as-is.
    console.error("[contact] sendEmail failed:", error);
    return Response.json(
      { error: "We couldn't send your message right now. Please try again in a moment." },
      { status: 502 }
    );
  }
}
