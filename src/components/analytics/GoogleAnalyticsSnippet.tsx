import { GoogleAnalytics } from "@next/third-parties/google";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * GA4 via `@next/third-parties/google`'s `<GoogleAnalytics>` (loads
 * `gtag.js` after hydration, same deferred-load approach as every other
 * third-party snippet in this codebase). Reads the measurement ID from
 * `NEXT_PUBLIC_GA_MEASUREMENT_ID` (see `.env.example`) instead of
 * hardcoding it — set in Vercel **Production only**, so Preview deploys
 * and local dev never load it. Renders nothing when that env var is
 * unset, same "unconfigured → skip silently" pattern as
 * `OmnisendSnippet.tsx`.
 *
 * Pageviews: deliberately NOT sending manual `page_view` events on
 * client-side route changes. GA4's own Enhanced Measurement already
 * tracks a `page_view`-equivalent history-change event automatically
 * (Admin → Data Streams → this stream → Enhanced measurement → "Page
 * changes based on browser history events") — sending our own on top of
 * that double-counts every navigation. If Enhanced Measurement is ever
 * turned off, this needs a route-change listener added back (the
 * `OmnisendPageView.tsx` pattern, mounted alongside this one) — don't add
 * one preemptively while it's still handling this.
 *
 * Ecommerce events (`view_item`, `add_to_cart`, `view_cart`,
 * `begin_checkout`) are fired from their own call sites via
 * `src/lib/analytics/ga.ts` — `purchase` deliberately isn't one of them,
 * since that stays with Shopify's own checkout tracking once the visitor
 * leaves for `checkout.tomfoolerychocolate.com`.
 */
export function GoogleAnalyticsSnippet() {
  if (!GA_MEASUREMENT_ID) return null;

  return <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />;
}
