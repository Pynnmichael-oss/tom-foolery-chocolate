"use client";

import { sendGAEvent } from "@next/third-parties/google";
import type { Cart, Product, ProductVariant } from "@/lib/shopify/types";

/**
 * GA4 standard ecommerce events for the headless store. `purchase` is
 * deliberately not here — that stays with Shopify's own checkout
 * tracking once the visitor leaves for `checkout.tomfoolerychocolate.com`
 * (see GoogleAnalyticsSnippet.tsx's own comment).
 *
 * `sendGAEvent` (from `@next/third-parties/google`, not a hand-rolled
 * `window.gtag` call) already no-ops safely if `<GoogleAnalytics>` was
 * never mounted (GA env var unset — local dev, Preview) or hasn't
 * finished loading yet, so every exported function here is safe to call
 * unconditionally from any call site.
 */

interface GAItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
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
  sendGAEvent("event", "view_item", {
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
  sendGAEvent("event", "add_to_cart", {
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
  sendGAEvent("event", "view_cart", {
    currency: cart.subtotal.currencyCode,
    value: Number(cart.subtotal.amount),
    items: cart.lines.map(lineToItem),
  });
}

/** Fire on the Checkout link's click, before the browser navigates away
 * to Shopify. See CartDrawer.tsx. */
export function trackBeginCheckout(cart: Cart) {
  if (cart.lines.length === 0) return;
  sendGAEvent("event", "begin_checkout", {
    currency: cart.subtotal.currencyCode,
    value: Number(cart.subtotal.amount),
    items: cart.lines.map(lineToItem),
  });
}
