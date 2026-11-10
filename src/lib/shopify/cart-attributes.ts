import type { CartAttribute } from "./types";

/**
 * Two lines of the same variant (and selling plan) only merge into one
 * quantity when their attributes match exactly — same rule Shopify's own
 * cart applies. Without this, two different gift sets (say, one with a
 * Holiday band and one with a Birthday band) would collapse into a
 * single line and lose one set's choices. Order-sensitive on purpose:
 * Shopify compares them the same way, and every caller builds them in a
 * fixed order (see lib/gift-builder/cart-line.ts).
 */
export function sameAttributes(a: CartAttribute[] = [], b: CartAttribute[] = []): boolean {
  return a.length === b.length && a.every((x, i) => x.key === b[i].key && x.value === b[i].value);
}

/** Attributes the shopper should see — keys starting with `_` are
 * internal (Shopify hides them at checkout too). */
export function visibleAttributes(attributes: CartAttribute[] = []): CartAttribute[] {
  return attributes.filter((a) => !a.key.startsWith("_") && a.value);
}
