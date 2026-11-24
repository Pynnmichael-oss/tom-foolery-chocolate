"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { metaTrack, sendMetaServerEvent } from "@/lib/analytics/meta";

// Module scope, not a useRef: inside <Suspense> the App Router remounts
// this component on client-side navigations (see OmnisendPageView.tsx).
let handledInitialPageView = false;

/**
 * Meta `PageView`s after the first, plus the Conversions API copy of the
 * first one.
 *
 * MetaPixel.tsx's inline script fires the first-load browser `PageView`
 * (as early as possible, before hydration) and switches off fbevents.js's
 * automatic History API pageviews, which carry no event ID. On first run
 * this component sends that PageView's server copy with the same event ID;
 * on every later route change it fires a new browser + server pair.
 *
 * Renders nothing. Mounted in the root layout inside `<Suspense>`, which
 * `useSearchParams` needs.
 */
export function MetaPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!handledInitialPageView) {
      handledInitialPageView = true;
      const id = window.__metaPageViewId;
      if (id) sendMetaServerEvent("PageView", id);
      return;
    }
    metaTrack("PageView");
  }, [pathname, searchParams]);

  return null;
}
