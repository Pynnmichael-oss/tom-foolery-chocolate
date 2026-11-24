"use client";

import type { Product, ProductVariant } from "@/lib/shopify/types";
import type { MetaSiteEvent } from "./meta-config";

declare global {
  interface Window {
    /** Queue stub defined by MetaPixel.tsx's inline script (production
     * only). Calls made before fbevents.js loads are queued and replayed. */
    fbq?: (...args: unknown[]) => void;
    /** `eventID` of the first-load PageView that MetaPixel.tsx's inline
     * script fires, so MetaPageView.tsx can send the matching server event. */
    __metaPageViewId?: string;
  }
}

/**
 * Meta Pixel + Conversions API events for the headless store.
 *
 * Every event goes out twice with one shared event ID: through the browser
 * Pixel (`fbq('track', name, params, { eventID })`) and through
 * `/api/meta/events`, which forwards it server-side to the Conversions API.
 * Meta deduplicates the pair on `event_name` + `event_id`, so each action
 * counts once, and still gets counted when the browser Pixel is blocked.
 *
 * Covers `PageView` (MetaPageView.tsx), `ViewContent` and `AddToCart`
 * (called from `ga.ts`, so call sites make one tracking call per action).
 * `InitiateCheckout` and `Purchase` happen on Shopify's checkout domain and
 * are sent there by Shopify's Facebook & Instagram channel, Pixel and
 * Conversions API both. Firing `InitiateCheckout` here as well (on the
 * Checkout click) would count every checkout twice.
 *
 * No-ops when `window.fbq` doesn't exist (Preview, local dev), so every
 * function is safe to call unconditionally; the server relay is skipped
 * then too.
 */

export function newMetaEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Server copy of an event already sent by the browser Pixel. Uses
 * `keepalive` so an AddToCart right before navigating away still sends. */
export function sendMetaServerEvent(
  name: MetaSiteEvent,
  eventId: string,
  customData?: Record<string, unknown>
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    void fetch("/api/meta/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: name,
        event_id: eventId,
        event_source_url: window.location.href,
        custom_data: customData,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Tracking must never break the page.
  }
}

/** Browser Pixel + Conversions API, deduplicated by a shared event ID. */
export function metaTrack(name: MetaSiteEvent, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  const eventId = newMetaEventId();
  window.fbq("track", name, params ?? {}, { eventID: eventId });
  sendMetaServerEvent(name, eventId, params);
}

/** `gid://shopify/ProductVariant/123` → `"123"`, the plain numeric ID that
 * Shopify uses for variants in its product feeds. Anything that isn't a
 * Shopify GID is passed through unchanged. */
function shopifyNumericId(gid: string): string {
  return gid.match(/\/(\d+)$/)?.[1] ?? gid;
}

export function metaViewContent(product: Product, variant: ProductVariant) {
  const id = shopifyNumericId(variant.id);
  metaTrack("ViewContent", {
    content_ids: [id],
    content_type: "product",
    content_name: product.title,
    contents: [{ id, quantity: 1 }],
    currency: variant.price.currencyCode,
    value: Number(variant.price.amount),
  });
}

export function metaAddToCart(
  product: Pick<Product, "title">,
  variant: ProductVariant,
  quantity: number
) {
  const id = shopifyNumericId(variant.id);
  metaTrack("AddToCart", {
    content_ids: [id],
    content_type: "product",
    content_name: product.title,
    contents: [{ id, quantity }],
    currency: variant.price.currencyCode,
    value: Number(variant.price.amount) * quantity,
  });
}
