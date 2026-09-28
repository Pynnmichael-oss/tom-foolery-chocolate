"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";

/**
 * Real heritage photo — pulled from the live production homepage
 * (https://tomfoolerychocolate.com/cdn/shop/files/Screenshot_2026-08-02_211853.png?v=1786909732,
 * fetched 2026-09-10, same file/version). Saved locally at
 * `public/photos/heritage-founding-family.jpg` (converted from the original
 * PNG — fully opaque, so flattened to JPEG to match this folder's other
 * assets). Already black-and-white; render it as-is, no filter.
 *
 * TODO(garrett): confirm who's pictured and the occasion. The alt text below
 * describes only what's visible in the frame (the cake reads "God Bless You,
 * Bertha, Tommy and Mr. George", transcribed off the photo itself). If this
 * is Tom Meldrum at the Sugar Bowl, say so and update the alt — don't assert
 * it until confirmed. If a different photo replaces it, only `HERITAGE_PHOTO`
 * changes.
 */
const HERITAGE_PHOTO = {
  src: "/photos/heritage-founding-family.jpg",
  alt: "Black-and-white photo of five people holding a cake decorated with a floral wreath and the handwritten message “God Bless You, Bertha, Tommy and Mr. George,” in front of a football-themed mural",
  width: 847,
  height: 703,
} as const;

/**
 * Copy from Garrett (owner), verbatim. Paragraph three is deliberately its
 * own entry — it's the emphasized closer.
 */
const INTRO_PARAGRAPHS = [
  "Before there was Tom Foolery, there was Tom Meldrum — my grandfather and proprietor of the Sugar Bowl, a good old-fashioned candy store in the heart of Massillon, Ohio. It was the kind of place you stopped by for a sweet treat after work, a gift for any occasion, or just a little joy in your day.",
  "More than 50 years and three generations later, Tom Foolery is our ode to those days. We're on a mission to bring a little fun to your day, one piece of chocolate at a time. With real, high-quality chocolate, nostalgic flavors, and a little twist on it all, every bite is meant to bring a smile to your face.",
] as const;
const CLOSER = "So here's to breaking open a bar or a bon bon, and living a little.";
const SIGN_OFF = "— Garrett";

/**
 * Heritage beat on /story: the family photo beside Garrett's note (photo
 * left, copy right from `lg` up; photo above copy below that).
 *
 * Motion: the photo fades/rises, then the paragraphs and sign-off stagger
 * in — each group on its own ScrollTrigger so mobile's stacked layout
 * reveals the copy as it scrolls into view, not while it's still off
 * screen. Transform/opacity only, and only under
 * `prefers-reduced-motion: no-preference`. The hidden starting state is CSS
 * (globals.css, `html.js [data-story-reveal]`) so it's in place before first
 * paint; GSAP animates *to* the resting state with `fromTo`, mirroring those
 * values. Reduced-motion and no-JS visitors see everything at rest.
 */
export function HeritageBeat() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = sectionRef.current;
      if (!root) return;
      const photo = root.querySelector<HTMLElement>("[data-story-reveal=photo]");
      const copy = root.querySelector<HTMLElement>("[data-story-copy]");
      const lines = gsap.utils.toArray<HTMLElement>("[data-story-reveal=line]", root);

      const mm = gsap.matchMedia();

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
          for (const t of tweens) {
            t.scrollTrigger?.kill();
            t.kill();
          }
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="bg-tf-black/5 px-fluid-md py-fluid-3xl">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-fluid-xl lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Plain white mat + soft shadow: this is the one photo on the page
         * that should read as a kept, genuine print, not a playful cutout. */}
        <div
          data-story-reveal="photo"
          className="mx-auto w-full max-w-xl bg-tf-white p-4 shadow-[0_10px_24px_-10px_rgba(37,56,42,0.35)] lg:mx-0"
        >
          <Image
            src={HERITAGE_PHOTO.src}
            alt={HERITAGE_PHOTO.alt}
            width={HERITAGE_PHOTO.width}
            height={HERITAGE_PHOTO.height}
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="h-auto w-full"
          />
        </div>

        <div data-story-copy className="mx-auto flex w-full max-w-[60ch] flex-col gap-fluid-md lg:mx-0">
          {INTRO_PARAGRAPHS.map((text) => (
            // Plain <p>, not <BodyText>: that component doesn't pass through
            // the data attribute the reveal keys off. Same recipe — Sofia
            // Regular stand-in, --fs-body, brand line-height (size + 8pt).
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
          {/* Signature: no script face in the brand set (Feature Deck is a
           * serif — see BRAND_REFERENCE), so this is the display face in
           * italic at signature scale, echoing StoryHero's "—Tom" sign-off,
           * just larger. */}
          <p
            data-story-reveal="line"
            className="font-display italic text-fg"
            style={{ fontSize: "clamp(2.5rem, 1.8rem + 3vw, 4rem)", lineHeight: 1 }}
          >
            {SIGN_OFF}
          </p>
        </div>
      </div>
    </section>
  );
}
