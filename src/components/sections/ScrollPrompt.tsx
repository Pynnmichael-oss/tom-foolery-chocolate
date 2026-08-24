"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { useMediaPreferences } from "@/lib/hooks/useMediaPreferences";

/**
 * Subtle "keep scrolling" nudge between FeaturedProducts and the Story
 * spine. Follows `BrandVideo`'s reduced-motion pattern: read the
 * preference via the same `useMediaPreferences` hook and gate the whole
 * animated codepath on it, rather than leaning on a CSS motion-safe
 * variant that would just freeze mid-loop — under
 * `prefers-reduced-motion` this never builds a tween at all, so what
 * renders is a genuinely static hint, not a paused animation.
 * `saveData` isn't checked here (unlike `BrandVideo`) — a transform loop
 * on one small glyph has none of the payload cost a data-saver visitor is
 * actually trying to avoid.
 */
export function ScrollPrompt() {
  const iconRef = useRef<SVGSVGElement>(null);
  const { prefersReducedMotion } = useMediaPreferences();

  useGSAP(
    () => {
      if (prefersReducedMotion || !iconRef.current) return;

      const tween = gsap.to(iconRef.current, {
        y: 10,
        duration: 0.9,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true,
      });

      return () => {
        tween.kill();
      };
    },
    { dependencies: [prefersReducedMotion] }
  );

  return (
    <div className="flex flex-col items-center gap-fluid-xs py-fluid-lg text-center">
      {/* fg/70 (not /60): AA needs 4.5:1 at this size against a white bg —
       * /70 measures ~4.9:1, /60 falls short. Same tuning as Footer's
       * copyright line, different background. */}
      <p className="font-sans text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em] text-fg/70">
        Psst &mdash; there&rsquo;s more
      </p>
      <svg
        ref={iconRef}
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-fg/70"
      >
        <path d="M4 7l6 6 6-6" />
      </svg>
    </div>
  );
}
