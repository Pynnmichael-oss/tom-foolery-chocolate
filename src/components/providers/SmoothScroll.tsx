"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/components/motion/gsap";
import { useMediaPreferences } from "@/lib/hooks/useMediaPreferences";

/**
 * Drives Lenis smooth scroll from gsap's ticker so ScrollTrigger and Lenis
 * stay perfectly in sync (`lenis.on("scroll", ScrollTrigger.update)` —
 * the standard integration point; there's no separate `scrollerProxy`
 * here because Lenis runs in native mode, no custom wrapper/content, so
 * ScrollTrigger's own default `window` scroll reading already agrees
 * with it — the explicit `.update()` call is what keeps ScrollTrigger's
 * recalculation locked to Lenis's *eased* position every frame instead
 * of just the raw native one).
 *
 * Fully disabled under `prefers-reduced-motion` — via the same
 * `useMediaPreferences` hook every other motion-aware component in this
 * codebase already uses, not a one-time `matchMedia().matches` snapshot,
 * so a live OS toggle mid-session correctly tears Lenis down (rather than
 * Lenis's own `respectReducedMotion` lerp-forcing, which would still pay
 * for the rAF ticker). Leaves native (instant) scrolling in place.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const { prefersReducedMotion } = useMediaPreferences();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      autoRaf: false,
      duration: 1,
      smoothWheel: true,
      // No custom `easing` — Lenis's own default (expo-out) decelerates
      // more decisively near the end than the cubic curve this replaced,
      // which read as floaty over the site's longer pin distances
      // (BrandCompass's `+=400%` especially) without `duration` alone
      // needing to drop low enough to feel abrupt on an ordinary scroll.
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => {
      // gsap.ticker reports time in seconds; Lenis expects milliseconds.
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // ScrollTrigger measures every trigger's start/end against document
    // layout at creation time. Two things can shift that layout afterward
    // and leave pinned sections' trigger points drifted from where they
    // visually start/end: web fonts swapping in (changes text-flow
    // height, especially Fraunces at Hero/BrandCompass's display sizes)
    // and any asset still in flight at mount. Every image and video
    // poster in this app already renders inside an aspect-ratio'd or
    // `fill` wrapper — no layout shift on load by construction — so fonts
    // are the real risk here; `window.load` is a cheap belt-and-suspenders
    // on top of that.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready?.then(refresh).catch(() => {});
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [prefersReducedMotion]);

  return <>{children}</>;
}
