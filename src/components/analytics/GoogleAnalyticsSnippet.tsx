import Script from "next/script";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Manual gtag.js setup — replaces an earlier version that used
 * `@next/third-parties/google`'s `<GoogleAnalytics>` (see git history).
 * That component hardcodes `strategy="afterInteractive"` with no way to
 * defer further; measured against this hand-rolled `lazyOnload` version
 * (Lighthouse mobile, home, 3 runs each — see the PR this shipped in for
 * the numbers), lazyOnload won on LCP by enough to justify owning this
 * ourselves instead of using the library.
 *
 * Reads the measurement ID from `NEXT_PUBLIC_GA_MEASUREMENT_ID` (see
 * `.env.example`) — set in Vercel **Production only**, so Preview deploys
 * and local dev never load it. Renders nothing when unset, same
 * "unconfigured → skip silently" pattern as `OmnisendSnippet.tsx`.
 *
 * Two pieces, in order:
 *
 * 1. A plain inline `<script>` (not `next/script` — this one needs to run
 *    immediately during HTML parsing, same as layout.tsx's own
 *    `JS_CLASS_SCRIPT`), Google's own canonical gtag snippet shape:
 *    defines `window.dataLayer`/`window.gtag` and queues the initial `js`/
 *    `config` calls. This is what makes "fire-before-load" safe —
 *    `src/lib/analytics/ga.ts`'s event functions push to this same
 *    `dataLayer` array directly, so an event fired before step 2 below
 *    has finished loading just sits in the array until gtag.js arrives
 *    and replays everything queued, in order. Negligible cost (a few
 *    bytes of inline JS, no network request) — this is the part that has
 *    to be early, not the part that's expensive.
 * 2. The actual `gtag.js` script tag, loaded via `next/script`'s
 *    `strategy="lazyOnload"` — the most deferred strategy Next offers
 *    (window load + idle), lower cost than the `afterInteractive` the
 *    library component was locked into.
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

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "window.dataLayer=window.dataLayer||[];" +
            "function gtag(){dataLayer.push(arguments);}" +
            "gtag('js',new Date());" +
            `gtag('config','${GA_MEASUREMENT_ID}');`,
        }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
    </>
  );
}
