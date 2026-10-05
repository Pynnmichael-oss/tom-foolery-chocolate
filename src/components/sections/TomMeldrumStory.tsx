"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { EyesHatIcon } from "@/components/ui/logos";

/**
 * Same real heritage photo HeritageBeat used — see that file's own former
 * comment for provenance (this component supersedes it on /story).
 */
const HERITAGE_PHOTO = {
  src: "/photos/heritage-founding-family.jpg",
  alt: "Black-and-white photo of five people holding a cake decorated with a floral wreath and the handwritten message “God Bless You, Bertha, Tommy and Mr. George,” in front of a football-themed mural",
  width: 847,
  height: 703,
} as const;

/**
 * Garrett's letter (owner), verbatim. The ONLY departure from his original
 * wording is the em dash after "Tom Meldrum" below: the letter's first
 * sentence originally continued past it ("… Tom Meldrum — my grandfather
 * and proprietor of the Sugar Bowl …"); split at that dash, the opening
 * clause becomes the lead-in headline (dash swapped for a period) and the
 * rest continues as the first line of body copy, capitalized to start its
 * own sentence. The second paragraph and the closer run after that exactly
 * as written.
 */
const HEADLINE = "Before there was Tom Foolery, there was Tom Meldrum.";
const INTRO_PARAGRAPHS = [
  "My grandfather and proprietor of the Sugar Bowl, a good old-fashioned candy store in the heart of Massillon, Ohio. It was the kind of place you stopped by for a sweet treat after work, a gift for any occasion, or just a little joy in your day.",
  "More than 50 years and three generations later, Tom Foolery is our ode to those days. We're on a mission to bring a little fun to your day, one piece of chocolate at a time. With real, high-quality chocolate, nostalgic flavors, and a little twist on it all, every bite is meant to bring a smile to your face.",
] as const;
const CLOSER = "So here's to breaking open a bar or a bon bon, and living a little.";

/**
 * Tom Meldrum / Sugar Bowl beat on /story — the family photo beside
 * Garrett's note (photo left, copy right from `lg` up; photo above copy
 * below that). Same single-beat shape the former `HeritageBeat` used, with
 * three upgrades: the letter's opening clause is pulled out as a real
 * headline instead of buried in the paragraph, the photo gets a subtle
 * scroll-tied zoom inside its mat, and a signature/mark sign-off closes it
 * out. No elaborate multi-section staging — this replaced an earlier,
 * more built-out version per a content review (see git history).
 *
 * Motion: the photo fades/rises and the headline rises in (transform-only,
 * LCP-safe) on their own ScrollTriggers, then the paragraphs/closer/
 * signature stagger in together — same recipe `HeritageBeat` used.
 * Transform/opacity only, and only under `prefers-reduced-motion:
 * no-preference`. Pre-paint starting states live in globals.css
 * (`data-story-reveal`, `data-tom-meldrum`), gated on `html.js` +
 * no-preference, so there's no server-paints-visible → JS-hides-it flash.
 */
export function TomMeldrumStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = sectionRef.current;
      if (!root) return;

      const photo = root.querySelector<HTMLElement>('[data-story-reveal="photo"]');
      const copy = root.querySelector<HTMLElement>("[data-story-copy]");
      const lines = gsap.utils.toArray<HTMLElement>("[data-story-reveal=line]", root);

      const mm = gsap.matchMedia();

      mm.add(breakpoints.reducedMotion, () => {
        gsap.set([photo, ...lines].filter(Boolean) as HTMLElement[], { opacity: 1, y: 0 });
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

        if (copy && lines.length) {
          tweens.push(
            gsap.fromTo(
              lines,
              { y: 24, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out",
                stagger: 0.16,
                scrollTrigger: { trigger: copy, start: "top 82%", once: true },
              }
            )
          );
        }

        return () => {
          tweens.forEach((tween) => {
            tween.scrollTrigger?.kill();
            tween.kill();
          });
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} aria-label="Before Tom Foolery" className="bg-tf-white px-fluid-md py-fluid-3xl">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-fluid-xl lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Plain white mat + soft shadow — a kept, genuine print, not a
         * playful cutout. The inner wrapper scrubs a subtle zoom (1.12 →
         * 1) tied to scroll position, clipped by the mat's own frame. */}
        <div
          data-story-reveal="photo"
          className="mx-auto w-full max-w-xl bg-tf-white p-4 shadow-[0_10px_24px_-10px_rgba(37,56,42,0.35)] lg:mx-0"
        >
          <div className="relative aspect-[847/703] w-full overflow-hidden">
            <div ref={zoomRef} data-tom-meldrum="zoom" className="absolute inset-0">
              <Image
                src={HERITAGE_PHOTO.src}
                alt={HERITAGE_PHOTO.alt}
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[60ch] flex-col gap-fluid-md lg:mx-0">
          <h1
            ref={headlineRef}
            data-tom-meldrum="headline"
            className="font-display font-semibold text-fg"
            style={{
              fontSize: "clamp(1.75rem, 1.3rem + 2.25vw, 3rem)",
              lineHeight: "calc(1em + 16px)",
            }}
          >
            {HEADLINE}
          </h1>

          <div data-story-copy className="flex flex-col gap-fluid-md">
            {INTRO_PARAGRAPHS.map((text) => (
              <p
                key={text}
                data-story-reveal="line"
                className="font-sans font-normal text-fg/85"
                style={{ fontSize: "var(--fs-body)", lineHeight: "calc(1em + 10.67px)" }}
              >
                {text}
              </p>
            ))}
            <p
              data-story-reveal="line"
              className="font-display font-semibold text-fg"
              style={{ fontSize: "clamp(1.375rem, 1.1rem + 1.1vw, 1.9rem)", lineHeight: 1.25 }}
            >
              {CLOSER}
            </p>
            <div data-story-reveal="line" className="flex items-center gap-fluid-sm">
              <span className="font-display italic text-fg/70" style={{ fontSize: "var(--fs-body)" }}>
                — Garrett
              </span>
              <EyesHatIcon className="h-6 w-auto text-fg/50" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
