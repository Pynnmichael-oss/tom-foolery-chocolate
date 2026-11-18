import Script from "next/script";
import { isProductionRuntime } from "@/lib/env";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1690559959441889";

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
 * Pageviews: only the one `PageView` above. `fbevents.js` automatically
 * fires a `PageView` on client-side navigations (History API pushState),
 * which is how Next's router moves between pages, so adding a route-change
 * listener here would double-count every navigation.
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
            `fbq('init','${pixelId}');` +
            "fbq('track','PageView');",
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
