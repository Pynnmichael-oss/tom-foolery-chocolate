// Subscribes a visitor to Omnisend, tagged "website-popup". The 10%-off
// code itself is never generated or shown here: it's delivered by an
// Omnisend Welcome automation filtered on that tag (see
// docs/INTEGRATIONS.md).
//
// NOT currently called by anything: the signup popup this was built for
// (EmailSignupPopup.tsx) was replaced by Omnisend's own hosted popup
// (loaded via the snippet in src/components/analytics/OmnisendSnippet.tsx —
// see docs/INTEGRATIONS.md) and deleted. Left in place rather than
// removed because a future on-site form (e.g. a footer signup field) is
// still a plausible use for a plain POST-a-JSON-body-get-subscribed
// endpoint — delete this too if that never materializes.

export const runtime = "nodejs";
// Never cache/prerender — same as /api/contact and /api/gifting, see
// those routes' own comments.
export const dynamic = "force-dynamic";

const OMNISEND_API_URL = "https://api.omnisend.com/api/contacts";
// Pinned, not "latest" — an API's response shape can change between
// versions; pinning means this route only breaks on a deliberate bump,
// not silently whenever Omnisend ships one.
const OMNISEND_API_VERSION = "2026-03-15";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// TODO: in-memory, keyed by IP, module-scoped — resets on every cold
// start and isn't shared across concurrent serverless instances, so it's
// a rough abuse deterrent at best, not a real limit under load or behind
// a multi-instance deploy. Move to Upstash/Vercel KV (or similar shared
// store) before this needs to actually hold up.
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

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(trimmed)) return null;
  return trimmed;
}

interface SubscribePayload {
  email?: unknown;
  /** Honeypot — a real visitor never sees or fills this field; anything
   * in it means a bot that fills every field it finds. No current caller
   * sends one (see this file's top comment), but the check stays cheap
   * and harmless to leave in for whatever eventually POSTs here. */
  website?: unknown;
}

export async function POST(request: Request) {
  let body: SubscribePayload;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Bot caught by the honeypot: fake success, no Omnisend call, no hint
  // it was caught (a real error response would just teach the bot to
  // leave the field blank next time).
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return Response.json({ ok: true });
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(ip || "unknown")) {
    return Response.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  if (!process.env.OMNISEND_API_KEY) {
    // Deliberately thrown, not a graceful { error } response like the
    // sibling /api/contact and /api/gifting routes use for their own
    // "not configured yet" case — specified to fail loudly so a missing
    // key surfaces immediately in server logs/monitoring. Lives inside
    // the handler (not module scope) so it fires at request time, not
    // at build/import time.
    throw new Error("OMNISEND_API_KEY is not set — see .env.example.");
  }

  const nowIso = new Date().toISOString();

  let response: Response;
  try {
    response = await fetch(OMNISEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Omnisend-API-Key ${process.env.OMNISEND_API_KEY}`,
        "Omnisend-Version": OMNISEND_API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tags: ["website-popup"],
        identifiers: [
          {
            type: "email",
            id: email,
            channels: {
              email: { status: "subscribed", statusChangedAt: nowIso },
            },
            consent: {
              source: "website-popup",
              createdAt: nowIso,
              ip,
              userAgent: request.headers.get("user-agent") ?? "",
            },
          },
        ],
      }),
    });
  } catch (error) {
    console.error("[subscribe] Omnisend request failed:", error);
    return Response.json(
      { error: "We couldn't sign you up right now. Please try again in a moment." },
      { status: 502 }
    );
  }

  // 201 = new contact created, 200 = an existing contact was updated —
  // both are a successful subscribe from the visitor's point of view;
  // `existing` just lets the client pick the right success copy.
  if (response.status === 200 || response.status === 201) {
    return Response.json({ ok: true, existing: response.status === 200 });
  }

  // Never log the API key itself — only the response Omnisend sent back,
  // which is what's actually useful for debugging a 4xx/5xx.
  const errorBody = await response.text().catch(() => "<unreadable body>");
  console.error(`[subscribe] Omnisend returned ${response.status}:`, errorBody);
  return Response.json(
    { error: "We couldn't sign you up right now. Please try again in a moment." },
    { status: 502 }
  );
}
