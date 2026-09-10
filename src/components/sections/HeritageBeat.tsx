"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { Preheader, BodyText } from "@/components/ui/typography";
import { ScrapbookPhoto } from "@/components/ui/ScrapbookPhoto";

/** Real product photography (brand/PHOTO_INVENTORY.md) — decorative
 * texture accents flanking the real heritage photo below, not standing in
 * for anything. Down from three to two now that the middle slot (formerly
 * a placeholder "friends laughing" shot standing in for heritage/founder
 * photography) is the real thing — see `HERITAGE_PHOTO`. */
const SCRAPBOOK_PHOTOS = [
  {
    src: "/photos/craft-hazelnut-bar-flatlay.jpg",
    alt: "Overhead view of a hazelnut chocolate bar broken into pieces",
    width: 1241,
    height: 2200,
    rotation: -3,
  },
  {
    src: "/photos/truffles-turmeric-background.jpg",
    alt: "Five bonbons arranged vertically on a turmeric-orange background",
    width: 545,
    height: 727,
    rotation: -2.5,
  },
] as const;

/**
 * Real heritage photo — pulled from the live production homepage
 * (https://tomfoolerychocolate.com/cdn/shop/files/Screenshot_2026-08-02_211853.png?v=1786909732,
 * fetched 2026-09-10, same file/version) where it already runs under the
 * "Built on three generations of tradition" line, so it's very likely the
 * actual claim's source photo rather than placeholder photography. Saved
 * locally at `public/photos/heritage-founding-family.jpg` (converted from
 * the original PNG — fully opaque, so flattened to JPEG to match this
 * folder's other assets).
 *
 * TODO(garrett): confirm who's pictured and the occasion — the cake in
 * frame reads "God Bless You, Bertha, Tommy and Mr. George" (transcribed
 * off the photo itself, not guessed), which is a strong hint of an actual
 * three-name/three-generation moment, but not something to assert as fact
 * in copy or a caption without you confirming it. If a different photo
 * should replace it later, only `HERITAGE_PHOTO` below needs to change.
 */
const HERITAGE_PHOTO = {
  src: "/photos/heritage-founding-family.jpg",
  alt: "Black-and-white photo of five people holding a cake decorated with a floral wreath and the handwritten message “God Bless You, Bertha, Tommy and Mr. George,” in front of a football-themed mural",
  width: 847,
  height: 703,
} as const;

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
        {/* The real heritage photo — see `HERITAGE_PHOTO` above for
         * provenance. Deliberately the opposite of `ScrapbookPhoto`'s
         * treatment: no tilt, no torn edge, a plain white mat and a soft
         * shadow instead of the cluster's deeper one below — this is the
         * one photo on the page that should read as a kept, genuine print
         * rather than playful cutout. Sized larger than the product-shot
         * duo underneath it, too, so it reads as the section's anchor,
         * not a third scrapbook item. */}
        <div className="mx-auto w-full max-w-sm bg-tf-white p-3 shadow-[0_10px_24px_-10px_rgba(37,56,42,0.35)]">
          <Image
            src={HERITAGE_PHOTO.src}
            alt={HERITAGE_PHOTO.alt}
            width={HERITAGE_PHOTO.width}
            height={HERITAGE_PHOTO.height}
            sizes="(min-width: 640px) 384px, 80vw"
            className="h-auto w-full"
          />
        </div>

        {/*
         * TODO(client-assets): these two are the brand guide's own
         * extracted product photography (brand/PHOTO_INVENTORY.md) — real
         * bar/bonbon shots, kept here purely as decorative texture
         * flanking the heritage photo above, not standing in for anything
         * that needs real client photography. `ScrapbookPhoto` doesn't
         * need to change, just the src/alt/dimensions in
         * `SCRAPBOOK_PHOTOS` above.
         */}
        <div className="grid w-full max-w-xs grid-cols-2 gap-fluid-lg sm:max-w-sm">
          {SCRAPBOOK_PHOTOS.map((photo) => (
            <ScrapbookPhoto
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              rotation={photo.rotation}
              sizes="(min-width: 640px) 180px, 40vw"
              className="mx-auto w-full max-w-[180px]"
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
