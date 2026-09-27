import Script from "next/script";

const BRAND_ID = process.env.NEXT_PUBLIC_OMNISEND_BRAND_ID;

declare global {
  interface Window {
    /** Omnisend's own command queue, created by the snippet below
     * (`window.omnisend = window.omnisend || []`). Each entry is a
     * `[command, ...args]` tuple, pushed the same way the snippet itself
     * does — see `OmnisendPageView.tsx` for the one other place this
     * codebase pushes to it. */
    omnisend?: unknown[][];
  }
}

/**
 * Omnisend's official tracking snippet, verbatim from
 * https://api-docs.omnisend.com/docs/how-to-connect-the-store except the
 * brand ID, which comes from `NEXT_PUBLIC_OMNISEND_BRAND_ID` (see
 * .env.example) instead of being hardcoded. Loaded by hand because this
 * store is headless: Omnisend's Shopify app normally injects this via a
 * theme App Embed, which has nothing to embed into on this frontend.
 *
 * Powers Omnisend's own hosted on-site popup (the branded multi-step
 * welcome-discount form, managed entirely in the Omnisend dashboard — see
 * docs/INTEGRATIONS.md) along with whatever else Omnisend is configured
 * to run on-site. Do not edit the snippet's own logic below — if Omnisend
 * ever changes it, replace this whole `__html` string with their new one
 * rather than hand-editing.
 *
 * A Server Component on purpose: `next/script`'s `strategy="afterInteractive"`
 * is Next's own hydration-gated loading, nothing React-state-driven — no
 * client runtime needed to render this, so `"use client"` would only cost
 * client-bundle size for nothing.
 *
 * Route-change `$pageViewed` tracking for this App Router SPA is a
 * separate concern, handled by the sibling `OmnisendPageView.tsx` (this
 * snippet only ever fires once, on the real page load).
 */
export function OmnisendSnippet() {
  if (!BRAND_ID) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[omnisend] NEXT_PUBLIC_OMNISEND_BRAND_ID is not set — skipping the Omnisend snippet. See .env.example."
      );
    }
    return null;
  }

  return (
    <Script
      id="omnisend-snippet"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
//OMNISEND-SNIPPET-SOURCE-CODE-V1
window.omnisend = window.omnisend || [];
omnisend.push(["brandID", ${JSON.stringify(BRAND_ID)}]);
omnisend.push(["track", "$pageViewed"]);
!function(){var e=document.createElement("script");e.type="text/javascript",e.async=!0,e.src="https://omnisnippet1.com/inshop/launcher-v2.js";var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t)}();
        `,
      }}
    />
  );
}
