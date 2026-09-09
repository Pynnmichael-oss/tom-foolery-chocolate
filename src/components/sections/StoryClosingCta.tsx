"use client";

import { useRef } from "react";
import Link from "next/link";
import { PinnedSection } from "@/components/motion/PinnedSection";
import { Headline } from "@/components/ui/typography";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { POWER_STATEMENTS } from "@/lib/site";

/**
 * Closing beat — a Power Statement headline scrubs down in scale as the
 * CTA button scrubs up in opacity beneath it, so the two visually trade
 * places over the pin (a "turning into" transition, not a hard cut).
 * `text-tf-white` lives on the section wrapper (not the individual
 * elements) so the button's `secondary` variant — `border-current
 * bg-transparent text-current`, per `buttonClasses`' own doc comment —
 * inherits white for free instead of needing an override.
 *
 * TODO: `href` points at `/shop` — this app's own all-products route.
 * The brief mentions `/collections/all`, which is Shopify-hosted-storefront
 * convention; this Next storefront serves its product listing at `/shop`
 * instead (see `FeaturedProductsReveal`'s "Shop All" link), so `/shop` is
 * the working equivalent. Swap to a specific featured product link
 * instead if that's preferred once real targeting is decided.
 */
export function StoryClosingCta() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);

  return (
    <PinnedSection
      className="relative flex h-dvh w-full flex-col items-center justify-center gap-fluid-lg bg-tf-cinnamon-strong px-fluid-md text-center text-tf-white"
      pinDistance="+=100%"
      scrub={true}
      onTimeline={(tl, { reducedMotion }) => {
        if (!headlineRef.current || !buttonRef.current) return;

        if (reducedMotion) {
          tl.set(headlineRef.current, { scale: 1, y: 0 });
          tl.set(buttonRef.current, { opacity: 1, y: 0 });
          return;
        }

        tl.set(buttonRef.current, { opacity: 0, y: 24 });
        tl.to(headlineRef.current, { scale: 0.72, y: -32, ease: "none" }).to(
          buttonRef.current,
          { opacity: 1, y: 0, ease: "none" },
          "<"
        );
      }}
    >
      <Headline ref={headlineRef} as="h2" size="lg">
        {POWER_STATEMENTS.funTastesBetter}
      </Headline>
      <Link ref={buttonRef} href="/shop" className={buttonClasses("secondary")}>
        Shop the Collection
      </Link>
    </PinnedSection>
  );
}
