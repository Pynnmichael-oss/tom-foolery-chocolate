"use client";

import { useCallback } from "react";
import type { MouseEvent } from "react";
import { useMediaPreferences } from "@/lib/hooks/useMediaPreferences";

/**
 * Shared "Learn More" CTA behavior for every button that points at
 * `/gifting`'s inquiry form (the hero and all three panels): smooth-scroll
 * to the form and move focus to its first field, so keyboard and
 * screen-reader users land where they need to type next, not just
 * visually at the section.
 *
 * Plain native `element.scrollIntoView({behavior:"smooth"})`, not Lenis —
 * Lenis's instance lives privately inside `SmoothScroll` with no exported
 * ref/context for another component to drive it. Native smooth scroll
 * coexists with Lenis fine here: Lenis just picks up from wherever this
 * lands on the visitor's next wheel/touch input.
 *
 * Reduced-motion handling follows the same `useMediaPreferences` hook
 * every other motion-aware component in this codebase already uses (see
 * `BrandVideo.tsx`), not a one-off `matchMedia` snapshot.
 */
export function useScrollToGiftingForm() {
  const { prefersReducedMotion } = useMediaPreferences();

  return useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      const form = document.getElementById("gifting-form");
      // No target on the page this ran on — fall back to the plain
      // `href="#gifting-form"` anchor jump instead of no-op'ing.
      if (!form) return;

      event.preventDefault();
      form.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });

      // `preventScroll` matters here: `scrollIntoView` above already owns
      // the visual scroll — without it, focusing the input would trigger
      // its own (instant) scroll-into-view and fight the smooth one.
      document.getElementById("tf-gifting-first-name")?.focus({ preventScroll: true });
    },
    [prefersReducedMotion]
  );
}
