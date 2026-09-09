"use client";

import { useRef } from "react";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { Preheader, BodyText } from "@/components/ui/typography";
import { ScrapbookPhoto } from "@/components/ui/ScrapbookPhoto";

/** Real product/lifestyle photography (brand/PHOTO_INVENTORY.md) standing
 * in for the "scrapbook" cluster — see the TODO in the JSX below. */
const SCRAPBOOK_PHOTOS = [
  {
    src: "/photos/craft-hazelnut-bar-flatlay.jpg",
    alt: "Overhead view of a hazelnut chocolate bar broken into pieces",
    width: 1241,
    height: 2200,
    rotation: -3,
    className: "",
  },
  {
    src: "/photos/heritage-friends-sharing-chocolate.jpg",
    alt: "Two friends laughing together over a piece of chocolate",
    width: 1956,
    height: 2200,
    rotation: 2,
    className: "sm:mt-fluid-lg",
  },
  {
    src: "/photos/truffles-turmeric-background.jpg",
    alt: "Five bonbons arranged vertically on a turmeric-orange background",
    width: 545,
    height: 727,
    rotation: -2.5,
    className: "",
  },
] as const;

/**
 * Quiet, grounded beat between StoryHero's exuberance and the "Live a
 * Little" pinned statement — deliberately plain: a single soft fade-up
 * as it enters view, no pin, no scrub, no display type. A breath, not a
 * beat, on purpose — the contrast is the point.
 */
export function HeritageBeat() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const mm = gsap.matchMedia();

      mm.add(breakpoints.reducedMotion, () => {
        gsap.set(sectionRef.current, { opacity: 1, y: 0 });
      });

      mm.add(breakpoints.motionOK, () => {
        gsap.set(sectionRef.current, { opacity: 0, y: 16 });

        const tween = gsap.to(sectionRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 85%" },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="bg-tf-black/5 px-fluid-md py-fluid-2xl text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-fluid-xl">
        {/*
         * TODO(client-assets): these three are the brand guide's own
         * extracted product photography (brand/PHOTO_INVENTORY.md) — real
         * bar/bonbon shots, but not heritage/founder/behind-the-scenes
         * photography. Swap for the real thing once the client provides
         * it; `ScrapbookPhoto` doesn't need to change, just the
         * src/alt/dimensions in `SCRAPBOOK_PHOTOS` above.
         */}
        <div className="grid w-full grid-cols-1 gap-fluid-lg sm:grid-cols-3 sm:items-start">
          {SCRAPBOOK_PHOTOS.map((photo) => (
            <ScrapbookPhoto
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              rotation={photo.rotation}
              sizes="(min-width: 640px) 220px, 60vw"
              className={`mx-auto w-full max-w-[220px] ${photo.className}`}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-fluid-sm">
          <Preheader className="text-fg/60">Heritage</Preheader>
          {/*
           * TODO(garrett): placeholder copy. Swap for the real founder/family
           * story once Garrett provides the actual three-generations detail
           * (names, decade, what specifically got handed down) — see the
           * conversation this section was built in. Keep this beat's quieter,
           * grounded register even once real copy lands; it's a deliberate
           * contrast to StoryHero's exuberance and shouldn't get louder.
           */}
          <BodyText size="lg" className="text-fg/80">
            Built on three generations of tradition &amp; handcrafted for
            maximal enjoyment.
          </BodyText>
        </div>
      </div>
    </section>
  );
}
