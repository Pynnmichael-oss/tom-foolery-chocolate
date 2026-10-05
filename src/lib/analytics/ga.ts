"use client";

import type { Cart, Product, ProductVariant } from "@/lib/shopify/types";

declare global {
  interface Window {
    /** Set up by GoogleAnalyticsSnippet.tsx's inline bootstrap script
     * before anything else on the page runs — see that file's own
     * comment. */
    dataLayer?: unknown[];
    /** Same script defines this — `function gtag(){dataLayer.push(arguments);}`.
     * Calling it (not pushing a plain array to `dataLayer` directly) is
     * required: confirmed by hand that gtag.js's own backlog processing
     * on load only picks up entries shaped like an `arguments` object
     * (what `gtag()` produces), and silently ignores a plain array
     * pushed straight onto `dataLayer` — an event fired before gtag.js
     * has loaded would queue but then never actually send. */
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * GA4 standard ecommerce events for the headless store. `purchase` is
 * deliberately not here — that stays with Shopify's own checkout
 * tracking once the visitor leaves for `checkout.tomfoolerychocolate.com`
 * (see GoogleAnalyticsSnippet.tsx's own comment).
 *
 * `gtagEvent` calls `window.gtag('event', name, params)` — the real
 * `gtag()` wrapper, not a hand-rolled `dataLayer.push`, see that global's
 * own comment above for why. No-ops when `window.gtag` doesn't exist yet
 * (GA env var unset — local dev, Preview — the bootstrap script in
 * GoogleAnalyticsSnippet.tsx never ran), so every exported function here
 * is safe to call unconditionally from any call site.
 */

interface GAItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}

function gtagEvent(name: string, params: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

function lineToItem(line: Cart["lines"][number]): GAItem {
  return {
    item_id: line.merchandiseId,
    item_name: line.product.title,
    price: Number(line.price.amount),
    quantity: line.quantity,
  };
}

/** PDP view — fire once per product page load, not on every variant
 * selection change (that's a different event, not requested here). */
export function trackViewItem(product: Product, variant: ProductVariant) {
  gtagEvent("view_item", {
    currency: variant.price.currencyCode,
    value: Number(variant.price.amount),
    items: [
      {
        item_id: variant.id,
        item_name: product.title,
        price: Number(variant.price.amount),
        quantity: 1,
      },
    ],
  });
}

/** Fire after a successful `addItem` — see AddToCartButton.tsx. */
export function trackAddToCart(
  product: Pick<Product, "title">,
  variant: ProductVariant,
  quantity: number
) {
  gtagEvent("add_to_cart", {
    currency: variant.price.currencyCode,
    value: Number(variant.price.amount) * quantity,
    items: [
      {
        item_id: variant.id,
        item_name: product.title,
        price: Number(variant.price.amount),
        quantity,
      },
    ],
  });
}

/** Fire when the cart drawer transitions closed → open — not on every
 * cart mutation made while it's already open. See CartDrawer.tsx. */
export function trackViewCart(cart: Cart) {
  if (cart.lines.length === 0) return;
  gtagEvent("view_cart", {
    currency: cart.subtotal.currencyCode,
    value: Number(cart.subtotal.amount),
    items: cart.lines.map(lineToItem),
  });
}

/** Fire on the Checkout link's click, before the browser navigates away
 * to Shopify. See CartDrawer.tsx. */
export function trackBeginCheckout(cart: Cart) {
  if (cart.lines.length === 0) return;
  gtagEvent("begin_checkout", {
    currency: cart.subtotal.currencyCode,
    value: Number(cart.subtotal.amount),
    items: cart.lines.map(lineToItem),
  });
}
