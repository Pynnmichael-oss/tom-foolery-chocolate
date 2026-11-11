/**
 * The gift set builder products, keyed by the `?set=` value on
 * /gifts/build. Kept in its own dependency-free module so the core
 * catalog code (lib/shopify/queries.ts) can import it without pulling in
 * the builder.
 *
 * These products are only purchasable through the builder — bought as
 * plain products they'd have no flavors/band on the order — so they're
 * kept out of the shop grid and their /shop/[handle] page redirects here.
 */
export const GIFT_SETS = {
  bars: "build-your-own-bar-gift-set",
  caramels: "malort-caramel-gift-set",
} as const;

export type GiftSetKey = keyof typeof GIFT_SETS;

/** `?set=` key for a gift set product handle, or null for any other product. */
export function giftSetKeyForHandle(handle: string): GiftSetKey | null {
  const entry = Object.entries(GIFT_SETS).find(([, h]) => h === handle);
  return entry ? (entry[0] as GiftSetKey) : null;
}

/** Tags on the $0 "(Gift Set)" component products (and anything else
 * internal). They exist only so a set's contents land on the order with
 * real SKUs, and must never show up on the site as products. */
export const GIFT_COMPONENT_TAG = "gift-component";
export const HIDDEN_PRODUCT_TAGS = [GIFT_COMPONENT_TAG, "internal"] as const;

/** Storefront `products(query:)` filter that leaves those out. */
export const LISTING_QUERY_FILTER = HIDDEN_PRODUCT_TAGS.map((t) => `-tag:${t}`).join(" ");

/** True for products that must never appear in listings, collections,
 * the sitemap or as their own product page: the gift set builder products
 * (sold only through /gifts/build) and the hidden-tag component products. */
export function isHiddenFromListings(p: { handle: string; tags?: string[] | null }): boolean {
  if (giftSetKeyForHandle(p.handle)) return true;
  const tags = (p.tags ?? []).map((t) => t.toLowerCase());
  return HIDDEN_PRODUCT_TAGS.some((t) => tags.includes(t));
}
