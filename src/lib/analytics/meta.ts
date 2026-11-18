"use client";

import type { Product, ProductVariant } from "@/lib/shopify/types";

declare global {
  interface Window {
    /** Queue stub defined by MetaPixel.tsx's inline script (production
     * only). Calls made before fbevents.js loads are queued and replayed. */
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Meta Pixel standard events for the headless store, sent alongside the GA4
 * events in `ga.ts` (called from there, so there's one tracking call per
 * user action at each call site).
 *
 * Deliberately limited to `ViewContent` and `AddToCart`. `InitiateCheckout`
 * and `Purchase` happen on Shopify's checkout domain and are sent by
 * Shopify's Facebook & Instagram channel. Firing `InitiateCheckout` here as
 * well (on the Checkout click) would count every checkout twice.
 *
 * `PageView` isn't here either: MetaPixel.tsx sends the first one and
 * fbevents.js tracks client-side navigations itself.
 *
 * No-ops when `window.fbq` doesn't exist (Preview, local dev), so every
 * function is safe to call unconditionally.
 */

function fbqTrack(name: string, params: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", name, params);
}

/** `gid://shopify/ProductVariant/123` → `"123"`, the plain numeric ID that
 * Shopify uses for variants in its product feeds. Anything that isn't a
 * Shopify GID is passed through unchanged. */
function shopifyNumericId(gid: string): string {
  return gid.match(/\/(\d+)$/)?.[1] ?? gid;
}

export function metaViewContent(product: Product, variant: ProductVariant) {
  const id = shopifyNumericId(variant.id);
  fbqTrack("ViewContent", {
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
  fbqTrack("AddToCart", {
    content_ids: [id],
    content_type: "product",
    content_name: product.title,
    contents: [{ id, quantity }],
    currency: variant.price.currencyCode,
    value: Number(variant.price.amount) * quantity,
  });
}
