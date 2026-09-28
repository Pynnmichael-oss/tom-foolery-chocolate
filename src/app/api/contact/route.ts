import { isResendConfigured, sendEmail } from "@/lib/resend/client";

// Never cache/prerender — this only ever runs in response to a real
// submission (see Route Handlers docs: POST isn't cached by default
// anyway, but stated explicitly since GET handlers elsewhere in this repo
// opt into caching and it's worth being unambiguous here).
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 5000;

// Same shape as /api/subscribe/route.ts's rate limiter — see that file's
// own TODO, which applies here too: in-memory, keyed by IP, module-
// scoped, resets on every cold start and isn't shared across concurrent
// serverless instances. A rough abuse deterrent, not a real limit under
// load or behind a multi-instance deploy — move to Upstash/Vercel KV (or
// similar shared store) before this needs to actually hold up.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count += 1;
  return true;
}

function getClientIp(request: Request): string {
  // First entry in x-forwarded-for is the original client — everything
  // after it is proxies/load balancers the request passed through.
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "";
}

// Overridable once a verified sending domain exists — see .env.example.
// `onboarding@resend.dev` is Resend's own shared sandbox sender, usable
// with any API key before a domain is verified, but only deliverable to
// the Resend account's own registered email (see the setup notes in
// .env.example) — swap CONTACT_FROM_EMAIL once tomfoolerychocolate.com
// (or a subdomain) is verified in Resend so it can actually reach Garrett.
const DEFAULT_FROM = "Tom Foolery Website <onboarding@resend.dev>";
// TODO(garrett): this is TEMPORARY — pointed at Michael's inbox for testing
// while onboarding@resend.dev (no verified domain yet) can only deliver to
// the Resend account's own verified email, not garrett@tomfoolerychocolate.com.
// Switch this back to "garrett@tomfoolerychocolate.com" once
// tomfoolerychocolate.com (or a subdomain) is verified in Resend — see the
// setup notes in .env.example.
const DEFAULT_TO = "pynnmichael@outlook.com";

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  /** Honeypot — see ContactForm.tsx's hidden `website` input. A real
   * visitor never sees or fills this field; anything in it means a bot
   * that fills every field it finds. */
  website?: unknown;
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

  // Bot caught by the honeypot: fake success, no email sent, no hint it
  // was caught (a real error response would just teach the bot to leave
  // the field blank next time) — same as /api/subscribe/route.ts.
  if (typeof body.website === "string" && body.website.trim() !== "") {
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

  try {
    const sent = await sendEmail({
      to: process.env.CONTACT_TO_EMAIL || DEFAULT_TO,
      from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
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
