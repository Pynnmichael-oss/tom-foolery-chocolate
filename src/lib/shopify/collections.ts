/**
 * Collections that exist in Shopify for admin/app plumbing rather than as
 * pages a shopper (or a crawler) should land on:
 *
 * - `frontpage` — Shopify's built-in "Home page" collection.
 * - `for-shopify-performance-tracking` — auto-created by the Faire sales
 *   channel; its title and description are Faire's own admin notice.
 *
 * Shopify and Faire both use them, so they stay in the admin; they're just
 * kept out of the sitemap and static params here, and
 * /collections/[handle] permanently redirects them to /shop. A new
 * app-created collection needs adding here by hand — the Storefront API
 * has no "internal" flag to filter on.
 */
export const HIDDEN_COLLECTION_HANDLES: readonly string[] = [
  "frontpage",
  "for-shopify-performance-tracking",
];

export function isHiddenCollection(handle: string): boolean {
  return HIDDEN_COLLECTION_HANDLES.includes(handle.toLowerCase());
}
