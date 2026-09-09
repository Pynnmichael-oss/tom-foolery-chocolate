"use client";

import { useRef } from "react";
import { PinnedSection } from "@/components/motion/PinnedSection";
import { CharacterMark } from "@/components/ui/CharacterMark";

const STRIPE_WIDTH = 28; // px

/**
 * Stripe-pattern curtain that wipes open on scroll to reveal a Tom
 * character mark peeking through, at the seam between `StoryHero` and
 * `HeritageBeat` — the brand guide's "Character in Stripes" motif
 * (brand/BRAND_REFERENCE.md §5) turned into a scroll transition instead
 * of a static graphic. Strictly black-and-white stripes, per the guide's
 * own rule ("stripes must only ever be black and white — never...any
 * brand accent color").
 *
 * The mark itself needs no separate reveal animation: it sits centered
 * *behind* the two stripe halves (lower in DOM/paint order, no z-index
 * needed), so it's only ever visible once the halves have actually
 * parted — the reveal comes from the wipe itself, not a cross-fade.
 * Reuses `PinnedSection` — same primitive every other pinned beat on this
 * page builds on — so reduced motion is handled for free: that fork
 * skips the ScrollTrigger/pin and just sets the parted end state.
 *
 * TODO(brand-assets): `CharacterMark` below is a placeholder eyes+hat
 * silhouette (same shape `TomPeek` already uses) — swap for a real
 * character illustration once one's pulled from the Illustrations asset
 * folder (brand/BRAND_REFERENCE.md §5, Gap 6).
 */
export function StripeCurtainReveal() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  return (
    <PinnedSection
      className="relative h-dvh w-full overflow-hidden bg-tf-white"
      pinDistance="+=80%"
      scrub={true}
      onTimeline={(tl, { reducedMotion }) => {
        const halves = [leftRef.current, rightRef.current];
        if (halves.some((el) => !el)) return;

        const partedX = (i: number) => (i === 0 ? -100 : 100);

        if (reducedMotion) {
          tl.set(halves, { xPercent: partedX });
          return;
        }

        tl.to(halves, { xPercent: partedX, ease: "none" });
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
      >
        <CharacterMark className="h-20 w-auto text-tf-black sm:h-28" />
      </div>

      <div
        ref={leftRef}
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1/2"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, var(--tf-black) 0 ${STRIPE_WIDTH}px, var(--tf-white) ${STRIPE_WIDTH}px ${STRIPE_WIDTH * 2}px)`,
        }}
      />
      <div
        ref={rightRef}
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-1/2"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, var(--tf-black) 0 ${STRIPE_WIDTH}px, var(--tf-white) ${STRIPE_WIDTH}px ${STRIPE_WIDTH * 2}px)`,
        }}
      />
    </PinnedSection>
  );
}
