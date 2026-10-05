"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { StripeDivider } from "@/components/ui/StripeDivider";
import { EyesHatIcon } from "@/components/ui/logos";

/**
 * Same real heritage photo HeritageBeat used — see that file's own comment
 * for provenance. This page no longer renders HeritageBeat (superseded by
 * this component per the Tom Meldrum redesign), but the asset and its alt
 * text are unchanged.
 */
const HERITAGE_PHOTO = {
  src: "/photos/heritage-founding-family.jpg",
  alt: "Black-and-white photo of five people holding a cake decorated with a floral wreath and the handwritten message “God Bless You, Bertha, Tommy and Mr. George,” in front of a football-themed mural",
} as const;

/**
 * Garrett's letter (owner), verbatim, staged as a four-beat scroll story
 * instead of one text block. The ONLY departure from his original wording
 * is the em dash after "Tom Meldrum" below: the letter's first sentence
 * originally continued past it ("… Tom Meldrum — my grandfather and
 * proprietor of the Sugar Bowl …"); split at that dash, the opening clause
 * becomes the page's headline (dash swapped for a period so it reads as a
 * complete sentence) and everything after it — unedited — becomes the pull
 * quote in the next beat. The second paragraph and the closer run after
 * that exactly as written.
 */
const OPENING_HEADLINE = "Before there was Tom Foolery, there was Tom Meldrum.";
const SUGAR_BOWL_QUOTE =
  "my grandfather and proprietor of the Sugar Bowl, a good old-fashioned candy store in the heart of Massillon, Ohio. It was the kind of place you stopped by for a sweet treat after work, a gift for any occasion, or just a little joy in your day.";
const THEN_AND_NOW =
  "More than 50 years and three generations later, Tom Foolery is our ode to those days. We're on a mission to bring a little fun to your day, one piece of chocolate at a time. With real, high-quality chocolate, nostalgic flavors, and a little twist on it all, every bite is meant to bring a smile to your face.";
const CLOSER = "So here's to breaking open a bar or a bon bon, and living a little.";

// Same solid-pill recipe as WhatWeBelieve's "Shop the Chocolate" CTA
// (bg-tf-black fill, not buttonClasses("primary")'s cinnamon-strong) — kept
// as its own local constant here rather than factored out, matching how
// each section in this codebase already owns its CTA class string.
const SHOP_CTA_CLASS =
  "inline-flex items-center justify-center rounded-full border-2 border-tf-black bg-tf-black px-fluid-md py-fluid-sm " +
  "font-sans text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em] text-tf-white cursor-pointer " +
  "transition-transform duration-200 ease-out " +
  "motion-safe:hover:-rotate-1 motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-black focus-visible:ring-offset-2";

/**
 * Tom Meldrum / Sugar Bowl redesign of the /story page's opening beats —
 * replaces the removed turmeric `StoryHero` and the old `HeritageBeat`
 * block with a single scroll-driven staging of Garrett's letter. No copy
 * beyond the preheader labels is new; see the constants above for exactly
 * what came from the letter and what (if anything) changed.
 *
 * Motion: every beat fades/rises on its own ScrollTrigger (transform/
 * opacity only), same recipe as HeritageBeat/StoryHero before it — pinning
 * is reserved for StoryClosingCta's full-bleed pin further down the page.
 * The opening photo additionally scrubs a subtle zoom-out (scale 1.12 → 1)
 * tied directly to scroll position so it still reads right if the photo is
 * already in view at load. Pre-paint starting states live in globals.css
 * (`data-story-reveal`, `data-tom-meldrum`), gated on `html.js` +
 * `prefers-reduced-motion: no-preference` — reduced-motion visitors get
 * everything at rest, no ScrollTrigger ever created.
 */
export function TomMeldrumStory() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scopeRef.current;
      if (!root) return;

      const photo = root.querySelector<HTMLElement>('[data-story-reveal="photo"]');
      const lines = gsap.utils.toArray<HTMLElement>('[data-story-reveal="line"]', root);

      const mm = gsap.matchMedia();

      mm.add(breakpoints.reducedMotion, () => {
        gsap.set([photo, ...lines].filter(Boolean) as HTMLElement[], {
          opacity: 1,
          y: 0,
        });
        if (headlineRef.current) gsap.set(headlineRef.current, { y: 0 });
        if (zoomRef.current) gsap.set(zoomRef.current, { scale: 1 });
      });

      mm.add(breakpoints.motionOK, () => {
        const tweens: gsap.core.Animation[] = [];

        if (photo) {
          tweens.push(
            gsap.fromTo(
              photo,
              { y: 24, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.9,
                ease: "power2.out",
                scrollTrigger: { trigger: photo, start: "top 85%", once: true },
              }
            )
          );
        }

        if (headlineRef.current) {
          tweens.push(
            gsap.fromTo(
              headlineRef.current,
              { y: 32 },
              {
                y: 0,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: { trigger: headlineRef.current, start: "top 85%", once: true },
              }
            )
          );
        }

        if (zoomRef.current) {
          tweens.push(
            gsap.fromTo(
              zoomRef.current,
              { scale: 1.12 },
              {
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: zoomRef.current,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                },
              }
            )
          );
        }

        lines.forEach((el) => {
          tweens.push(
            gsap.fromTo(
              el,
              { y: 24, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.7,
                ease: "power2.out",
                scrollTrigger: { trigger: el, start: "top 85%", once: true },
              }
            )
          );
        });

        return () => {
          tweens.forEach((tween) => {
            tween.scrollTrigger?.kill();
            tween.kill();
          });
        };
      });

      return () => mm.revert();
    },
    { scope: scopeRef }
  );

  return (
    <div ref={scopeRef}>
      {/* a) Opening — full-bleed photo, headline stands alone below it */}
      <section aria-label="Before Tom Foolery" className="bg-tf-white">
        <div data-story-reveal="photo" className="w-full">
          <div
            className="relative aspect-[6/5] w-full overflow-hidden sm:aspect-[16/10] md:mx-auto md:max-w-5xl md:rounded-sm"
          >
            <div ref={zoomRef} data-tom-meldrum="zoom" className="absolute inset-0">
              <Image
                src={HERITAGE_PHOTO.src}
                alt={HERITAGE_PHOTO.alt}
                fill
                sizes="(min-width: 1024px) 64rem, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
        <div className="px-fluid-md py-fluid-lg md:py-fluid-xl">
          <h1
            ref={headlineRef}
            data-tom-meldrum="headline"
            className="mx-auto max-w-4xl text-center font-display font-semibold text-fg"
            style={{ fontSize: "var(--fs-header)", lineHeight: "calc(1em + 16px)" }}
          >
            {OPENING_HEADLINE}
          </h1>
        </div>
      </section>

      {/* b) The Sugar Bowl — the rest of that first sentence, as a pull quote */}
      <section aria-label="The Sugar Bowl" className="bg-tf-white px-fluid-md py-fluid-2xl">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-fluid-md text-center">
          <p
            data-story-reveal="line"
            className="font-sans font-black uppercase tracking-[0.075em] text-fg/60"
            style={{
              fontSize: "clamp(0.7rem, 0.65rem + 0.25vw, 0.85rem)",
              lineHeight: "calc(1em + 4px)",
            }}
          >
            Massillon, Ohio
          </p>
          <blockquote
            data-story-reveal="line"
            className="font-display font-semibold italic text-fg"
            style={{
              fontSize: "clamp(1.5rem, 1.1rem + 2vw, 2.75rem)",
              lineHeight: "calc(1em + 16px)",
            }}
          >
            &ldquo;{SUGAR_BOWL_QUOTE}&rdquo;
          </blockquote>
        </div>
      </section>

      <StripeDivider />

      {/* c) Then and now — the second paragraph */}
      <section aria-label="Then and now" className="bg-tf-white px-fluid-md py-fluid-2xl">
        <div className="mx-auto flex max-w-[60ch] flex-col gap-fluid-md">
          <p
            data-story-reveal="line"
            className="text-center font-sans font-black uppercase tracking-[0.075em] text-fg/60"
            style={{
              fontSize: "clamp(0.7rem, 0.65rem + 0.25vw, 0.85rem)",
              lineHeight: "calc(1em + 4px)",
            }}
          >
            50+ Years &middot; Three Generations
          </p>
          <p
            data-story-reveal="line"
            className="text-center font-sans font-normal text-fg/85"
            style={{ fontSize: "var(--fs-body)", lineHeight: "calc(1em + 10.67px)" }}
          >
            {THEN_AND_NOW}
          </p>
        </div>
      </section>

      {/* d) Close — the closer line, signature, mark, and shop CTA */}
      <section aria-label="Living a little" className="bg-tf-white px-fluid-md py-fluid-3xl text-center">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-fluid-lg">
          <p
            data-story-reveal="line"
            className="font-display font-semibold text-fg"
            style={{
              fontSize: "clamp(1.75rem, 1.3rem + 2.25vw, 3rem)",
              lineHeight: "calc(1em + 16px)",
            }}
          >
            {CLOSER}
          </p>
          <p
            data-story-reveal="line"
            className="font-display italic text-fg/70"
            style={{ fontSize: "var(--fs-body)" }}
          >
            — Garrett
          </p>
          <EyesHatIcon data-story-reveal="line" className="h-10 w-auto text-fg/50" />
          <Link data-story-reveal="line" href="/shop" className={SHOP_CTA_CLASS}>
            Shop the Chocolate
          </Link>
        </div>
      </section>
    </div>
  );
}
