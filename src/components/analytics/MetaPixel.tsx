import Script from "next/script";
import { isProductionRuntime } from "@/lib/env";
import { META_PIXEL_ID } from "@/lib/analytics/meta-config";

function activePixelId() {
  return META_PIXEL_ID && isProductionRuntime() ? META_PIXEL_ID : null;
}

/**
 * Meta (Facebook/Instagram) Pixel.
 *
 * Production only (`isProductionRuntime()`), same as GTM in `GoogleTags.tsx`:
 * Preview deploys and `next dev` never send events to the live pixel. The ID
 * defaults to the store's pixel and can be overridden with
 * `NEXT_PUBLIC_META_PIXEL_ID`.
 *
 * Same split as `GoogleTags.tsx`, instead of Meta's copy-paste snippet
 * (which injects `fbevents.js` immediately during HTML parsing):
 *
 * 1. Inline `<script>`: Meta's own `fbq` queue stub, minus the part that
 *    injects the library, followed by `init` and the first `PageView`. Calls
 *    made before the library arrives sit in `fbq.queue` and are replayed.
 * 2. `fbevents.js` via `next/script` `lazyOnload`, the same deferred loading
 *    as gtag.js/gtm.js, so the pixel never competes with LCP.
 *
 * Pageviews: the inline script sends the first `PageView` with an
 * `eventID` (kept on `window.__metaPageViewId`), and `MetaPageView.tsx`
 * sends its server copy to the Conversions API plus one `PageView` per
 * client-side navigation, each with its own `eventID`. fbevents.js's own
 * History API pageview tracking is switched off (`fbq.disablePushState`)
 * because those automatic PageViews carry no event ID, so they couldn't be
 * deduplicated against the server copies.
 *
 * Don't also add this pixel as a tag in the GTM container, or every event
 * is sent twice. Checkout events (`InitiateCheckout` onward, `Purchase`)
 * belong to Shopify's Facebook & Instagram channel on the checkout domain.
 */
export function MetaPixel() {
  const pixelId = activePixelId();
  if (!pixelId) return null;

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "!function(f){if(f.fbq)return;var n=f.fbq=function(){n.callMethod?" +
            "n.callMethod.apply(n,arguments):n.queue.push(arguments)};" +
            "if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}(window);" +
            "fbq.disablePushState=!0;" +
            `fbq('init','${pixelId}');` +
            "var i=self.crypto&&crypto.randomUUID?crypto.randomUUID():" +
            "Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);" +
            "window.__metaPageViewId=i;" +
            "fbq('track','PageView',{},{eventID:i});",
        }}
      />
      <Script
        id="meta-pixel-js"
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="lazyOnload"
      />
    </>
  );
}

/** Meta's `<noscript>` PageView beacon. Render inside `<body>`. */
export function MetaPixelNoScript() {
  const pixelId = activePixelId();
  if (!pixelId) return null;

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element -- a 1×1 tracking beacon, not content */}
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        alt=""
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
      />
    </noscript>
  );
}
