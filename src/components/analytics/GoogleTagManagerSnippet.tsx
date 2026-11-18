import Script from "next/script";
import { isProductionRuntime } from "@/lib/env";

/** Google Tag Manager container. Override with `NEXT_PUBLIC_GTM_ID`. */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-WJ5T6GDB";

/**
 * Google Tag Manager container loader.
 *
 * Production only (`isProductionRuntime()` — Vercel Production, or a plain
 * `next build`/`next start` outside Vercel), so Preview deploys and local
 * dev never send data into the live container.
 *
 * Same two-piece shape as `GoogleAnalyticsSnippet.tsx`:
 *
 * 1. An inline `<script>` that runs during HTML parsing: sets up the shared
 *    `window.dataLayer` + `gtag` stub and pushes GTM's `gtm.js` start
 *    event. That push is what fires GTM's "Initialization"/"All Pages"
 *    triggers once the container arrives — without it, Page View tags in
 *    the container never fire. `dataLayer` is the same array
 *    GoogleAnalyticsSnippet and `src/lib/analytics/ga.ts` push to, so
 *    ecommerce events are visible to GTM triggers too.
 * 2. `gtm.js` itself via `next/script` `lazyOnload`, matching the GA
 *    snippet's deferred loading (see that file for the LCP rationale).
 *    Anything pushed before it loads sits in `dataLayer` and is replayed.
 *
 * Note: GA4 is already loaded directly by GoogleAnalyticsSnippet. Don't
 * also add a GA4 Configuration/Google tag for the same measurement ID
 * inside this GTM container, or every pageview is counted twice.
 */
export function GoogleTagManagerSnippet() {
  if (!GTM_ID || !isProductionRuntime()) return null;

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "window.dataLayer=window.dataLayer||[];" +
            "function gtag(){dataLayer.push(arguments);}" +
            "gtag('js',new Date());" +
            "dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});",
        }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
        strategy="lazyOnload"
      />
    </>
  );
}

/** GTM's `<noscript>` fallback — goes immediately inside `<body>`. */
export function GoogleTagManagerNoScript() {
  if (!GTM_ID || !isProductionRuntime()) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
