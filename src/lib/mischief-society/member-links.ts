import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/site";
import { MISCHIEF_SOCIETY_MEMBER_PATH } from "./config";

/**
 * Private member links: /mischief-society/member/<token>.
 *
 * A token names one membership (an order line) and is signed with a
 * server secret, so it can't be guessed or altered. No accounts, no
 * passwords: the link itself is the key, the same way a "view your order"
 * link works. It goes in the gift email, the "for me" member email, every
 * monthly email (via the Omnisend contact property), and can be re-sent
 * from the welcome page.
 *
 * Secret: MEMBER_LINK_SECRET, falling back to CRON_SECRET so no extra
 * Vercel setting is needed. Changing the secret invalidates every link
 * already sent, so set it once and leave it.
 */

const VERSION = "m1";

function secret(): string | null {
  const s = process.env.MEMBER_LINK_SECRET || process.env.CRON_SECRET;
  return s ? s : null;
}

export function isMemberLinkConfigured(): boolean {
  return secret() !== null;
}

/** "gid://shopify/Order/123" → "123" */
function numericId(gid: string): string {
  const m = /(\d+)$/.exec(gid);
  if (!m) throw new Error(`Not a Shopify ID: ${gid}`);
  return m[1];
}

function sign(payload: string, key: string): string {
  // Key derivation keeps these signatures distinct from any other use of
  // the same secret (e.g. CRON_SECRET's own bearer check).
  return createHmac("sha256", `mischief-society-member-link:${key}`)
    .update(payload)
    .digest("base64url")
    .slice(0, 32);
}

export function memberToken(orderGid: string, lineGid: string): string {
  const key = secret();
  if (!key) throw new Error("Member links need MEMBER_LINK_SECRET (or CRON_SECRET) to be set.");
  const payload = `${VERSION}.${numericId(orderGid)}.${numericId(lineGid)}`;
  return `${numericId(orderGid)}-${numericId(lineGid)}-${sign(payload, key)}`;
}

/** `origin` lets a request served from a Vercel preview send links that
 * open on that same preview (for testing); anything else gets the
 * production site. Only the site's own origin or *.vercel.app is accepted,
 * so a forged Host header can't point an emailed link elsewhere. */
export function memberUrl(orderGid: string, lineGid: string, origin?: string): string {
  return `${linkBase(origin)}${MISCHIEF_SOCIETY_MEMBER_PATH}/${memberToken(orderGid, lineGid)}`;
}

function linkBase(origin?: string): string {
  if (!origin) return SITE_URL;
  try {
    const url = new URL(origin);
    const site = new URL(SITE_URL);
    if (url.origin === site.origin) return site.origin;
    if (url.protocol === "https:" && url.hostname.endsWith(".vercel.app")) return url.origin;
  } catch {
    // fall through
  }
  return SITE_URL;
}

/** Returns the membership a token points at, or null if it's malformed
 * or the signature doesn't match. */
export function readMemberToken(token: string): { orderGid: string; lineGid: string } | null {
  const key = secret();
  if (!key) return null;
  const m = /^(\d{1,20})-(\d{1,20})-([A-Za-z0-9_-]{32})$/.exec(token);
  if (!m) return null;
  const [, orderId, lineId, sig] = m;
  const expected = sign(`${VERSION}.${orderId}.${lineId}`, key);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { orderGid: `gid://shopify/Order/${orderId}`, lineGid: `gid://shopify/LineItem/${lineId}` };
}
