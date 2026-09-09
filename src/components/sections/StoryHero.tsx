"use client";

import { useRef } from "react";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { Preheader } from "@/components/ui/typography";

export interface StoryHeroProps {
  preheader: string;
  /** One sentence/beat per entry — each line reveals independently as it
   * scrolls into view (not pinned; that treatment is reserved for the
   * "Live a Little" statement further down the page). The first line
   * renders as the page's `<h1>`, the rest as visually-matching
   * paragraphs — a monologue reads as one voice, not a heading + body. */
  lines: string[];
  /** Optional "—Tom" note per brand/BRAND_REFERENCE.md §4's Sign Off
   * lockup ("bottom of a statement, as if it's a note directly from
   * Tom") — text only here, not the logo variant (not yet built in
   * `logos.tsx`). */
  signOff?: string;
}

/**
 * Opening beat of the Story page — Tom's first-person monologue, revealed
 * one line at a time as the reader scrolls past each (fade + rise, no
 * pin/scrub). Each line gets its own `ScrollTrigger`, same one-trigger-
 * per-item shape as `FeaturedProductsReveal`'s card stagger, just fired
 * individually instead of batched — a monologue should land beat by beat,
 * not all at once.
 *
 * Reduced motion: every line renders at rest immediately, same
 * `gsap.matchMedia()` fork every other scroll-aware section in this
 * codebase uses (see `FeaturedProductsReveal`, `StripeDivider`) — no
 * ScrollTrigger is ever created on that branch.
 */
export function StoryHero({ preheader, lines, signOff }: StoryHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const lineEls =
        sectionRef.current?.querySelectorAll<HTMLElement>("[data-story-hero-line]");
      if (!lineEls || lineEls.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add(breakpoints.reducedMotion, () => {
        gsap.set(lineEls, { opacity: 1, y: 0 });
      });

      mm.add(breakpoints.motionOK, () => {
        gsap.set(lineEls, { opacity: 0, y: 28 });

        const tweens = Array.from(lineEls).map((el) =>
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 82%" },
          })
        );

        return () => {
          tweens.forEach((tween) => {
            tween.scrollTrigger?.kill();
            tween.kill();
          });
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [lines.length] }
  );

  return (
    <section
      ref={sectionRef}
      className="px-fluid-md py-fluid-3xl"
      aria-label="Tom's Story"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-fluid-2xl">
        <Preheader>{preheader}</Preheader>

        <div className="flex flex-col gap-fluid-xl">
          {lines.map((line, i) =>
            i === 0 ? (
              <h1
                key={i}
                data-story-hero-line
                className="font-display font-semibold text-fg"
                style={{
                  fontSize: "clamp(1.75rem, 1.2rem + 2.75vw, 3.5rem)",
                  lineHeight: "calc(1em + 16px)",
                }}
              >
                {line}
              </h1>
            ) : (
              <p
                key={i}
                data-story-hero-line
                className="font-display font-semibold text-fg"
                style={{
                  fontSize: "clamp(1.75rem, 1.2rem + 2.75vw, 3.5rem)",
                  lineHeight: "calc(1em + 16px)",
                }}
              >
                {line}
              </p>
            )
          )}
        </div>

        {signOff && (
          <p
            data-story-hero-line
            className="self-end font-display italic text-fg/70"
            style={{ fontSize: "var(--fs-body)" }}
          >
            {signOff}
          </p>
        )}
      </div>
    </section>
  );
}
