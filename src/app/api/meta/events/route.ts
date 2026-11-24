import { after } from "next/server";
import { cookies } from "next/headers";
import { isProductionRuntime } from "@/lib/env";
import { createRateLimiter, getClientIp } from "@/lib/forms/shared";
import { META_PIXEL_ID, META_SITE_EVENTS, type MetaSiteEvent } from "@/lib/analytics/meta-config";
import { SITE_URL } from "@/lib/site";

/**
 * Meta Conversions API relay for the headless store's own events
 * (`PageView`, `ViewContent`, `AddToCart`). `src/lib/analytics/meta.ts`
 * fires each event through the browser Pixel with an `eventID` and posts
 * the same event here with the same `event_id`, so Meta deduplicates the
 * pair into one event and keeps the server copy when the browser one is
 * blocked (ad blockers, ITP).
 *
 * The server adds what the browser can't send reliably: the visitor's IP
 * and user agent, and the `_fbp` / `_fbc` cookies (first-party, set by
 * fbevents.js on the root domain, so the same values reach Shopify's
 * checkout on the `checkout.` subdomain). When `_fbc` isn't set yet (a
 * first page view with `?fbclid=` that beat fbevents.js, which loads
 * lazily), it is built from the URL's `fbclid` in Meta's documented
 * `fb.1.<ms>.<fbclid>` format.
 *
 * Checkout events are not sent here: Shopify's Facebook & Instagram
 * channel sends `InitiateCheckout` … `Purchase` with its own Conversions
 * API connection.
 *
 * Needs `META_CAPI_ACCESS_TOKEN` (Events Manager → the dataset → Settings
 * → Conversions API → Generate access token). Without it, or outside
 * production, the route accepts the request and sends nothing, so the
 * browser side never has to care. `META_CAPI_TEST_EVENT_CODE` routes
 * events to Events Manager's Test Events tab while verifying; unset it
 * afterwards.
 */
export const dynamic = "force-dynamic";

const GRAPH_API_VERSION = "v24.0";

// Generous: a fast browse is a few events a second at most.
const checkRateLimit = createRateLimiter({ max: 120, windowMs: 60 * 1000 });

const EVENT_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

interface IncomingEvent {
  event_name?: unknown;
  event_id?: unknown;
  event_source_url?: unknown;
  custom_data?: unknown;
}

function siteHost(): string | null {
  try {
    return new URL(SITE_URL).hostname;
  } catch {
    return null;
  }
}

/** Only accept the page URL if it is on this site, so the endpoint can't
 * be used to attribute events to arbitrary URLs. */
function validSourceUrl(value: unknown): URL | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = siteHost();
    if (host && url.hostname !== host && url.hostname !== `www.${host}`) return null;
    return url;
  } catch {
    return null;
  }
}

/** Keep only the `custom_data` fields this site actually sends. */
function cleanCustomData(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  if (typeof v.currency === "string" && /^[A-Z]{3}$/.test(v.currency)) out.currency = v.currency;
  if (typeof v.value === "number" && Number.isFinite(v.value) && v.value >= 0) out.value = v.value;
  if (v.content_type === "product") out.content_type = "product";
  if (typeof v.content_name === "string") out.content_name = v.content_name.slice(0, 200);
  if (Array.isArray(v.content_ids)) {
    out.content_ids = v.content_ids
      .filter((id): id is string => typeof id === "string" && id.length <= 100)
      .slice(0, 50);
  }
  if (Array.isArray(v.contents)) {
    out.contents = v.contents
      .filter(
        (c): c is { id: string; quantity: number } =>
          !!c &&
          typeof c === "object" &&
          typeof (c as { id?: unknown }).id === "string" &&
          typeof (c as { quantity?: unknown }).quantity === "number"
      )
      .slice(0, 50)
      .map((c) => ({ id: c.id.slice(0, 100), quantity: Math.max(1, Math.floor(c.quantity)) }));
  }

  return Object.keys(out).length ? out : undefined;
}

export async function POST(request: Request) {
  let body: IncomingEvent;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const eventName = body.event_name;
  if (typeof eventName !== "string" || !META_SITE_EVENTS.includes(eventName as MetaSiteEvent)) {
    return new Response(null, { status: 400 });
  }
  if (typeof body.event_id !== "string" || !EVENT_ID_RE.test(body.event_id)) {
    return new Response(null, { status: 400 });
  }
  const sourceUrl = validSourceUrl(body.event_source_url);
  if (!sourceUrl) return new Response(null, { status: 400 });

  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token || !isProductionRuntime()) return new Response(null, { status: 204 });

  const ip = getClientIp(request);
  if (!checkRateLimit(ip || "unknown")) return new Response(null, { status: 429 });

  const userAgent = request.headers.get("user-agent") ?? "";
  // Meta needs either IP + user agent or a browser/click ID to match.
  // Requests without a user agent aren't browsers sending pixel events.
  if (!userAgent) return new Response(null, { status: 204 });

  const jar = await cookies();
  const fbp = jar.get("_fbp")?.value;
  let fbc = jar.get("_fbc")?.value;
  const fbclid = sourceUrl.searchParams.get("fbclid");
  if (!fbc && fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;

  const userData: Record<string, string> = { client_user_agent: userAgent };
  if (ip) userData.client_ip_address = ip;
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: body.event_id,
    event_source_url: sourceUrl.toString(),
    action_source: "website",
    user_data: userData,
    custom_data: cleanCustomData(body.custom_data),
  };

  const payload: Record<string, unknown> = { data: [event] };
  const testCode = process.env.META_CAPI_TEST_EVENT_CODE;
  if (testCode) payload.test_event_code = testCode;

  // Respond right away; the Graph API call runs after the response.
  after(async () => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(5000),
        }
      );
      if (!res.ok) {
        console.error(`[meta-capi] ${eventName} rejected (${res.status}): ${await res.text()}`);
      }
    } catch (error) {
      console.error(`[meta-capi] ${eventName} failed:`, error);
    }
  });

  return new Response(null, { status: 202 });
}
