"use client";

import { useRef } from "react";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";

export interface StripeDividerProps {
  className?: string;
  /** Width of each black/white stripe, in pixels. */
  stripeWidth?: number;
}

/**
 * Black/white stripe motif. Draws in (scaleX 0 → 1) as it scrolls into view;
 * under reduced motion it just renders fully drawn, no animation at all.
 */
export function StripeDivider({
  className = "",
  stripeWidth = 16,
}: StripeDividerProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!barRef.current) return;

      const mm = gsap.matchMedia();

      mm.add(breakpoints.reducedMotion, () => {
        gsap.set(barRef.current, { scaleX: 1 });
      });

      mm.add(breakpoints.motionOK, () => {
        gsap.set(barRef.current, { scaleX: 0, transformOrigin: "left center" });

        const tween = gsap.to(barRef.current, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: barRef.current,
            start: "top 85%",
            end: "top 40%",
            scrub: true,
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: barRef }
  );

  return (
    <div
      ref={barRef}
      role="presentation"
      aria-hidden="true"
      className={`h-3 w-full sm:h-4 ${className}`}
      style={{
        backgroundImage: `repeating-linear-gradient(90deg, var(--tf-black) 0 ${stripeWidth}px, var(--tf-white) ${stripeWidth}px ${
          stripeWidth * 2
        }px)`,
      }}
    />
  );
}
