"use client";

import { useRef } from "react";
import { PinnedSection } from "@/components/motion/PinnedSection";
import { Headline } from "@/components/ui/typography";
import { POWER_STATEMENTS } from "@/lib/site";

/**
 * "Live a Little" pinned statement — the Big Idea, blown up to fill the
 * viewport and scrubbed into focus as you scroll through the pin (scale
 * 0.8 → 1, opacity 0 → 1, tied straight to scroll position via `scrub`).
 * Reuses `PinnedSection` — same primitive Hero/StorySection/BrandCompass
 * all build on — so reduced motion is handled for free: that fork never
 * creates a ScrollTrigger/pin at all, just sets the resting state.
 *
 * TODO(brand-copy): `POWER_STATEMENTS.liveALittle` is just the "Live a
 * Little" one-liner (brand/BRAND_REFERENCE.md §1's "Brand idea"). Swap in
 * the full Big Idea copy block once it's pasted in — if it runs longer
 * than a single short phrase, drop the font size a tier (this is sized
 * for ~3 words) and consider a `Headline` array (`lines={[...]}`) instead
 * of a single string so it reveals line-by-line rather than as one block.
 */
export function LiveALittleStatement() {
  const headlineRef = useRef<HTMLHeadingElement>(null);

  return (
    <PinnedSection
      className="relative flex h-dvh w-full items-center justify-center bg-tf-black px-fluid-md text-center"
      pinDistance="+=150%"
      scrub={true}
      onTimeline={(tl, { reducedMotion }) => {
        if (!headlineRef.current) return;

        if (reducedMotion) {
          tl.set(headlineRef.current, { opacity: 1, scale: 1 });
          return;
        }

        tl.fromTo(
          headlineRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, ease: "none" }
        );
      }}
    >
      <Headline ref={headlineRef} as="h2" size="xl" className="text-tf-white">
        {POWER_STATEMENTS.liveALittle}
      </Headline>
    </PinnedSection>
  );
}
