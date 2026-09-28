/**
 * Shared between `/api/contact` and `/api/gifting` — validation,
 * escaping, honeypot, IP extraction, and rate limiting, extracted here so
 * the two routes stay in lockstep instead of drifting copies of the same
 * logic (see each route's own comments for how they use these).
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** First entry in x-forwarded-for is the original client — everything
 * after it is proxies/load balancers the request passed through. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "";
}

/** A real visitor never sees or fills the hidden honeypot field (see
 * ContactForm.tsx/GiftingForm.tsx's own `website` input) — anything in it
 * means a bot that fills every field it finds in the DOM. Callers fake a
 * success response instead of a real error, so the bot has no signal to
 * learn from (a real error would just teach it to leave the field blank
 * next time). */
export function isHoneypotTriggered(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "";
}

interface RateLimiterOptions {
  max: number;
  windowMs: number;
}

/**
 * In-memory, keyed by whatever string the caller passes (typically client
 * IP), module-scoped per limiter instance — each `createRateLimiter()`
 * call gets its own independent bucket map. Resets on every cold start
 * and isn't shared across concurrent serverless instances — a rough abuse
 * deterrent, not a real limit under load or behind a multi-instance
 * deploy. Move to Upstash/Vercel KV (or similar shared store) before this
 * needs to actually hold up.
 */
export function createRateLimiter({ max, windowMs }: RateLimiterOptions) {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return function checkRateLimit(key: string): boolean {
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (bucket.count >= max) return false;
    bucket.count += 1;
    return true;
  };
}
