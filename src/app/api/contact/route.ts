import { isResendConfigured, sendEmail } from "@/lib/resend/client";

// Never cache/prerender — this only ever runs in response to a real
// submission (see Route Handlers docs: POST isn't cached by default
// anyway, but stated explicitly since GET handlers elsewhere in this repo
// opt into caching and it's worth being unambiguous here).
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 5000;

// Overridable once a verified sending domain exists — see .env.example.
// `onboarding@resend.dev` is Resend's own shared sandbox sender, usable
// with any API key before a domain is verified, but only deliverable to
// the Resend account's own registered email (see the setup notes in
// .env.example) — swap CONTACT_FROM_EMAIL once tomfoolerychocolate.com
// (or a subdomain) is verified in Resend so it can actually reach Garrett.
const DEFAULT_FROM = "Tom Foolery Website <onboarding@resend.dev>";
const DEFAULT_TO = "garrett@tomfoolerychocolate.com";

interface ContactPayload {
  name?: unknown;
  email?: unknown;
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

export async function POST(request: Request) {
  let body: ContactPayload;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
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

  try {
    await sendEmail({
      to: process.env.CONTACT_TO_EMAIL || DEFAULT_TO,
      from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
      replyTo: email,
      subject: `New contact form message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      html:
        `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>` +
        `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    });
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
