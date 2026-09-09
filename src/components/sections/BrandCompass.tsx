"use client";

import { forwardRef, useRef } from "react";
import { PinnedSection } from "@/components/motion/PinnedSection";
import { gsap } from "@/components/motion/gsap";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { TextureBackground } from "@/components/ui/TextureBackground";
import { CharacterMark } from "@/components/ui/CharacterMark";
import { useMediaPreferences } from "@/lib/hooks/useMediaPreferences";
import type { TfColorToken } from "@/lib/theme";

interface Tenet {
  accent: TfColorToken;
  /** The guide's own "what it means" line — brand/BRAND_REFERENCE.md §1. */
  tag: string;
  name: string;
  body: string;
}

// Tenet/accent pairing per brand/BRAND_REFERENCE.md §1 (four tenets) and
// §2 (accent palette) — one accent color per tenet, as specified.
const TENETS: Tenet[] = [
  {
    accent: "turmeric",
    tag: "Originality Is Our Favorite Flavor",
    name: "Clever & Curious Chocolatiers",
    body: "We geek out over odd flavor pairings the way other people collect vinyl — if it hasn't been tried before, that's exactly why we're trying it.",
  },
  {
    accent: "juniper",
    tag: "A Total Wow",
    name: "Larger Than Life",
    body: "Subtle is for someone else's chocolate. Ours is built to surprise you — with color, with flavor, with a flourish you didn't see coming.",
  },
  {
    accent: "cinnamon",
    tag: "Chocolate Is Never Sad",
    name: "Simply Joyful",
    body: "A bad day doesn't stand a chance against a good bar. We make chocolate that's a beacon, not a Band-Aid.",
  },
  {
    accent: "rose",
    tag: "Throw Caution to the Wind",
    name: "A Touch of Rebellion",
    body: "Rules are more of a suggestion around here. Indulge first, ask questions never.",
  },
];

/**
 * Brand compass — one panel per tenet, within the Story spine. On the
 * motion-OK path (`BrandCompassScrub`) the viewport pins and the four
 * panels crossfade past as you scroll (Scout Motors-style), reusing
 * `PinnedSection` for the pin/ScrollTrigger mechanics — same primitive
 * Hero and StorySection already build on.
 *
 * Reduced motion follows `BrandVideo`'s pattern, not `PinnedSection`'s own
 * matchMedia branch: the crossfade layout (four panels absolutely stacked
 * on top of each other) only makes sense pinned, so under
 * `prefers-reduced-motion` this renders a genuinely different tree — a
 * plain stacked flow, `PinnedSection`/GSAP never mounted at all — rather
 * than the same DOM with the animation switched off. Same one-frame
 * caveat as `BrandVideo`/`ScrollPrompt`: the hook's `false` default on
 * first paint means a reduced-motion visitor can see the pinned tree
 * briefly before the fallback swaps in.
 *
 * Each panel's swatch now runs through `TextureBackground` (the brand
 * guide's vintage-print/fabric-weave texture treatment, brand/BRAND_REFERENCE.md
 * §5) instead of a flat color fill, plus a small placeholder `CharacterMark`
 * per tenet — same eyes+hat silhouette `TomPeek`/`StripeCurtainReveal` use.
 */
export function BrandCompass() {
  const { prefersReducedMotion } = useMediaPreferences();

  if (prefersReducedMotion) {
    return (
      <div className="flex flex-col">
        {TENETS.map((tenet) => (
          <CompassPanel key={tenet.name} tenet={tenet} className="min-h-[70vh] py-fluid-2xl" />
        ))}
      </div>
    );
  }

  return <BrandCompassScrub />;
}

function BrandCompassScrub() {
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);

  return (
    <PinnedSection
      className="relative h-dvh w-full overflow-hidden"
      pinDistance="+=400%"
      scrub={true}
      onTimeline={(tl) => {
        const panels = panelRefs.current;
        if (panels.some((p) => !p)) return;

        gsap.set(panels.slice(1), { opacity: 0, y: 24 });
        gsap.set(panels[0], { opacity: 1, y: 0 });

        tl.to({}, { duration: 0.6 }); // hold on the first tenet
        for (let i = 0; i < panels.length - 1; i++) {
          tl.to(panels[i], { opacity: 0, y: -24, duration: 1, ease: "none" }).to(
            panels[i + 1],
            { opacity: 1, y: 0, duration: 1, ease: "none" },
            "<"
          );
          tl.to({}, { duration: 0.6 }); // hold before the next crossfade
        }
      }}
    >
      {TENETS.map((tenet, i) => (
        <CompassPanel
          key={tenet.name}
          tenet={tenet}
          ref={(el) => {
            panelRefs.current[i] = el;
          }}
          className="absolute inset-0"
        />
      ))}
    </PinnedSection>
  );
}

const CompassPanel = forwardRef<HTMLDivElement, { tenet: Tenet; className?: string }>(
  function CompassPanel({ tenet, className = "" }, ref) {
    return (
      <TextureBackground
        ref={ref}
        color={tenet.accent}
        className={`flex flex-col items-center justify-center gap-fluid-md px-fluid-md text-center ${className}`}
      >
        {/* TODO(brand-assets): placeholder eyes+hat mark, same shape
         * TomPeek/StripeCurtainReveal use — swap for this tenet's real
         * character illustration once pulled from the Illustrations asset
         * folder (brand/BRAND_REFERENCE.md §5, Gap 6). */}
        <CharacterMark className="h-10 w-auto opacity-70" />
        <Preheader>{tenet.tag}</Preheader>
        <Headline size="lg" className="max-w-3xl">
          {tenet.name}
        </Headline>
        <BodyText size="lg" className="max-w-xl">
          {tenet.body}
        </BodyText>
      </TextureBackground>
    );
  }
);
