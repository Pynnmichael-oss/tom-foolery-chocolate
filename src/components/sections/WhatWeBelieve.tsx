"use client";

import { useRef } from "react";
import Link from "next/link";
import { PinnedSection } from "@/components/motion/PinnedSection";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { TextureBackground } from "@/components/ui/TextureBackground";
import { StripeDivider } from "@/components/ui/StripeDivider";
import type { TfColorToken } from "@/lib/theme";

// Same CTA recipe as GiftingHeroGraphic's "Shop Gifts" button (rounded
// pill, solid brand-black fill) — reused verbatim here rather than
// buttonClasses("primary"), which fills cinnamon-strong, not #25382A.
const SHOP_CTA_CLASS =
  "inline-flex items-center justify-center rounded-full border-2 border-tf-black bg-tf-black px-fluid-md py-fluid-sm " +
  "font-sans text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em] text-tf-white cursor-pointer " +
  "transition-transform duration-200 ease-out " +
  "motion-safe:hover:-rotate-1 motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-black focus-visible:ring-offset-2";

interface BeliefCardData {
  accent: TfColorToken;
  /** ALL CAPS label slot above the card header — same treatment as
   * `Preheader` everywhere else (Sofia Pro Black stand-in, brand/
   * BRAND_REFERENCE.md §3), optional per-card so a future card can skip it. */
  subhead?: string;
  header: string;
  body: string;
}

// Approved homepage copy — see the "What We Believe" section of the
// homepage copy brief. Accent assignment isn't guide-prescribed for this
// content (brand/BRAND_REFERENCE.md §1's tenet↔accent pairing is a
// different four-item list, used by `BrandCompass`); picked here for
// visual variety across the row, same accent palette either way.
const CARDS: BeliefCardData[] = [
  {
    accent: "cinnamon",
    subhead: "Nothing But the Best",
    header: "100% Real Chocolate 100% of the Time",
    body: "We use 100% real chocolate in all of our bars, bon bons, & confections because life is too short to waste it on the fake stuff",
  },
  {
    accent: "turmeric",
    subhead: "Simply Joyful",
    header: "Chocolate crafted with a smile in mind",
    body: "Our never precious, always fun, approach to chocolate is all about reinventing the flavors you know and love in a new, exciting, and full off chocolate format, guaranteed to bring a smile to your face.",
  },
  {
    accent: "juniper",
    subhead: "Proudly Handcrafted in Chicago",
    header: "Local feel, wherever you call home",
    body: "Handcrafted in the heart of Chicago, designed to make you feel at home, wherever that may be",
  },
];

/**
 * "What We Believe" — merges the former standalone Craft and Philosophy
 * `StorySection` beats (each a single headline/body block) into one
 * three-card belief statement. No Craft/Philosophy card grid existed
 * before this component (confirmed against git history) — the card look
 * (`TextureBackground` swatch + label/header/body stack) is borrowed from
 * `BrandCompass`'s tenet panels as a visual template only; the pin+scrub
 * reveal below is StorySection's entrance pattern (the sibling Heritage
 * section directly above this one), not BrandCompass's full-viewport
 * crossfade — a 3-up grid reads better revealed together than cycled one
 * at a time.
 */
export function WhatWeBelieve() {
  const preheaderRef = useRef<HTMLParagraphElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  return (
    <>
      {/* Marks the section boundary against FeaturedProducts above — the
       * job rose's background color used to do in variant A. A normal-flow
       * sibling, not pinned inside the section below: `PinnedSection`
       * glues that section's own top to the viewport top for the whole
       * scrub, which sits directly under the sticky nav — a stripe placed
       * there would render fully drawn but permanently hidden behind it. */}
      <StripeDivider />

      <PinnedSection
        className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-bg px-fluid-md py-fluid-2xl text-fg"
        // White, not rose — variant B of the bottom-section color swap (see
        // /story redesign request): the StripeDivider above does the work
        // rose's color used to (separating this section from
        // FeaturedProducts above), so the section itself can go back to
        // white/ink — the cinnamon/turmeric/juniper card row supplies all
        // the color here instead of the section background competing with
        // it. Still distinct from the pure-black footer below.
        style={{ "--bg": "var(--tf-white)", "--fg": "var(--tf-black)" } as React.CSSProperties}
        pinDistance="+=100%"
        scrub={true}
        onTimeline={(tl, { reducedMotion }) => {
          const cards = cardRefs.current.filter((el): el is HTMLDivElement => el !== null);

          if (reducedMotion) {
            tl.set([preheaderRef.current, headlineRef.current, ...cards, ctaRef.current], {
              opacity: 1,
              y: 0,
            });
            return;
          }

          tl.fromTo(
            preheaderRef.current,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
          )
            .fromTo(
              headlineRef.current,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
              "-=0.3"
            )
            .fromTo(
              cards,
              { opacity: 0, y: 32 },
              { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.12 },
              "-=0.3"
            )
            .fromTo(
              ctaRef.current,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
              "-=0.2"
            );
        }}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-fluid-xl">
        <div className="flex flex-col items-center gap-fluid-sm text-center">
          <Preheader ref={preheaderRef}>Our Philosophy</Preheader>
          <Headline ref={headlineRef} size="md">
            What We Believe
          </Headline>
        </div>

        <div className="grid grid-cols-1 gap-fluid-lg md:grid-cols-3">
          {CARDS.map((card, i) => (
            <TextureBackground
              key={card.header}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              color={card.accent}
              className="flex flex-col gap-fluid-sm rounded-2xl p-fluid-lg"
            >
              {card.subhead && <Preheader size="sm">{card.subhead}</Preheader>}
              {/* `size="sm"`'s clamp is viewport-width-driven, but this
               * heading's available width is column-width-driven — at the
               * `md:grid-cols-3` breakpoint the column is much narrower
               * relative to the viewport than at any other breakpoint (the
               * 3-up grid first appears at the same width a 1-up mobile
               * layout was just using the full viewport for), so the
               * clamp's naturally-larger mid-viewport size overflowed the
               * card by as much as 57px (measured at 768px). Forced down
               * with an `!important` arbitrary-value override (font-size
               * only — no bundled line-height, unlike a named `text-2xl`
               * scale utility, so the brand's Header line-height rule
               * above stays intact) for the entire range this can't
               * safely track via vw alone; verified overflow-free from
               * 768px through 1920px. */}
              <Headline as="h3" size="sm" className="md:text-[1.5rem]!">
                {card.header}
              </Headline>
              <BodyText>{card.body}</BodyText>
            </TextureBackground>
          ))}
        </div>

        {/* This is now the homepage's last section before the footer
         * (heritage StorySection + BrandCompass carousel removed) — a
         * forward CTA here is what used to be missing until you scrolled
         * past both of those. */}
        <div className="flex justify-center">
          <Link ref={ctaRef} href="/shop" className={SHOP_CTA_CLASS}>
            Shop the Chocolate
          </Link>
        </div>
      </div>
      </PinnedSection>
    </>
  );
}
