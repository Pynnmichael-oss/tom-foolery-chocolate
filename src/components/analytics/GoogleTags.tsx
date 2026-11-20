import Script from "next/script";
import { isProductionRuntime } from "@/lib/env";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-WJ5T6GDB";

/**
 * Google Analytics 4 (gtag.js) + Google Tag Manager (gtm.js), in one place.
 *
 * ## Who owns what (the anti-double-counting rule)
 *
 * - **GA4 is owned by this file**, via `gtag('config', GA_MEASUREMENT_ID)`
 *   plus the ecommerce events in `src/lib/analytics/ga.ts`. Pageviews come
 *   from GA4 Enhanced Measurement ("page changes based on browser history
 *   events"). No manual `page_view` events: Enhanced Measurement already
 *   sends them, so adding our own would count every navigation twice.
 * - **GTM is for everything else** (ad pixels, conversion tags, etc.). The
 *   GTM container must NOT contain a Google tag / GA4 Configuration tag or
 *   GA4 Event tags for the same measurement ID. If it does, every pageview
 *   and event reaches GA4 twice.
 * - `purchase` stays with Shopify's own checkout tracking on
 *   `checkout.tomfoolerychocolate.com`. Don't add one here or in GTM.
 *
 * ## Loading
 *
 * 1. One inline `<script>` runs during HTML parsing (plain `<script>`, not
 *    `next/script`, same as layout.tsx's `JS_CLASS_SCRIPT`). It creates the
 *    shared `window.dataLayer` and `gtag()` stub once, sends `gtag('js')`
 *    once, queues the GA4 `config`, and pushes GTM's `gtm.js` start event.
 *    GTM needs that start event to fire its "Initialization"/"All Pages"
 *    triggers. Anything pushed before the libraries arrive (including
 *    `ga.ts` events) sits in `dataLayer` and is replayed in order.
 * 2. `gtag.js` and `gtm.js` both load via `next/script` with
 *    `strategy="lazyOnload"` (after window load + idle). This was measured
 *    to beat `afterInteractive` on mobile LCP, which is why the site no
 *    longer uses `@next/third-parties/google` (see git history).
 *
 * ## Environments
 *
 * - GA4 renders only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set. It's set in
 *   Vercel for **Production only**.
 * - GTM renders only when `isProductionRuntime()`, so Preview deploys and
 *   `next dev` never send data into the live container.
 * - With neither active, nothing renders, and `ga.ts`'s calls no-op
 *   because `window.gtag` was never defined.
 */
function activeIds() {
  return {
    ga: GA_MEASUREMENT_ID || null,
    gtm: GTM_ID && isProductionRuntime() ? GTM_ID : null,
  };
}

export function GoogleTags() {
  const { ga, gtm } = activeIds();
  if (!ga && !gtm) return null;

  const bootstrap =
    "window.dataLayer=window.dataLayer||[];" +
    "function gtag(){dataLayer.push(arguments);}" +
    "gtag('js',new Date());" +
    (ga ? `gtag('config','${ga}');` : "") +
    (gtm ? "dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});" : "");

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: bootstrap }} />
      {ga && (
        <Script
          id="gtag-js"
          src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
          strategy="lazyOnload"
        />
      )}
      {gtm && (
        <Script
          id="gtm-js"
          src={`https://www.googletagmanager.com/gtm.js?id=${gtm}`}
          strategy="lazyOnload"
        />
      )}
    </>
  );
}

/** GTM's `<noscript>` fallback. Render immediately inside `<body>`. */
export function GoogleTagManagerNoScript() {
  const { gtm } = activeIds();
  if (!gtm) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtm}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
