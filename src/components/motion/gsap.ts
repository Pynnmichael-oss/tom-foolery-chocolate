import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Guard against SSR — these touch `window`/`document`.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/**
 * Shared gsap.matchMedia() breakpoints. Use `(prefers-reduced-motion: reduce)` /
 * `motionOK` explicitly rather than negating a query with `not`, which is
 * fussier to get right in the media-query grammar.
 */
export const breakpoints = {
  reducedMotion: "(prefers-reduced-motion: reduce)",
  motionOK: "(prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 767px)",
  tablet: "(min-width: 768px) and (max-width: 1023px)",
  desktop: "(min-width: 1024px)",
} as const;

export { gsap, ScrollTrigger, useGSAP };
