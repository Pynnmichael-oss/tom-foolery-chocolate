/**
 * The store's Meta Pixel / dataset ID. The same ID is configured in
 * Shopify's Facebook & Instagram channel (checkout domain), so browser
 * events, Conversions API events from `/api/meta/events`, and Shopify's
 * checkout events all land on one dataset. Override with
 * `NEXT_PUBLIC_META_PIXEL_ID`.
 */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1690559959441889";

/** Events the headless site sends through both the Pixel and the
 * Conversions API. Checkout events (`InitiateCheckout`, `Purchase`) are
 * Shopify's (see `meta.ts`). */
export const META_SITE_EVENTS = ["PageView", "ViewContent", "AddToCart"] as const;
export type MetaSiteEvent = (typeof META_SITE_EVENTS)[number];
