"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Module scope, not a useRef — this component sits inside a <Suspense>
// boundary (required for useSearchParams; see the component doc below),
// and the App Router actually *remounts* it on every client-side
// navigation rather than just re-rendering it in place (confirmed by
// hand: a useRef-based "is this the first render" flag was silently
// resetting on every navigation, since a fresh mount means a fresh ref).
// A module-level variable survives that remount — the module itself only
// re-evaluates on a genuine full page load, which is exactly when this
// should reset anyway (the snippet's own $pageViewed fires again then).
let hasFiredInitialPageView = false;

/**
 * Re-fires Omnisend's `$pageViewed` track call on client-side route
 * changes. `OmnisendSnippet.tsx`'s inline script only ever runs once, on
 * the real page load it's injected into — App Router navigations after
 * that are client-side (no new document, nothing re-executes the
 * snippet), so without this Omnisend would only ever see the very first
 * page of a visitor's session, however long they browse.
 *
 * Renders nothing — this is a side-effect-only component, mounted once in
 * the root layout inside a `<Suspense>` boundary (`useSearchParams` opts
 * the whole subtree out of static rendering unless it's wrapped; see
 * https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout —
 * isolating that to this one small component keeps the rest of the app
 * statically rendered).
 *
 * Verification note: `window.omnisend`'s `.push` gets overridden by
 * Omnisend's real launcher script once it loads, closing over its own
 * private queue rather than growing the public `window.omnisend` array
 * any further — so checking that array's contents/length is *not* a
 * valid way to confirm a post-init push did anything (confirmed by hand:
 * the override is `function(e){r(e),o[o.length]=e}`, `r` being
 * Omnisend's real reporting call). On `localhost` specifically, Omnisend
 * also CORS-rejects the snippet's own settings request (an unrecognized
 * hostname for the brand), which appears to hold back real event
 * reporting until settings load — so no outbound tracking request is
 * observable locally either, working code or not. Confirming the actual
 * network beacon fires needs testing on the real deployed domain.
 */
export function OmnisendPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Skip the initial run — the snippet's own inline
    // `omnisend.push(["track", "$pageViewed"])` already covers the first
    // page load; firing again here would double-count it.
    if (!hasFiredInitialPageView) {
      hasFiredInitialPageView = true;
      return;
    }

    // Guard, not an assumption: the snippet no-ops entirely when
    // NEXT_PUBLIC_OMNISEND_BRAND_ID is unset (see OmnisendSnippet.tsx),
    // and afterInteractive loading means there's a real (if usually
    // brief) window where it hasn't finished initializing yet either.
    if (typeof window === "undefined" || !window.omnisend) return;

    window.omnisend.push(["track", "$pageViewed"]);
    // pathname alone isn't the whole story — searchParams changing on the
    // same pathname (filters, pagination, etc.) is still a new "page" as
    // far as Omnisend's concerned, so both are dependencies here.
  }, [pathname, searchParams]);

  return null;
}
