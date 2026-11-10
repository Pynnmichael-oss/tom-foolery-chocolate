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
