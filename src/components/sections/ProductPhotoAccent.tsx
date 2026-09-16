"use client";

import { useRef } from "react";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { ScrapbookPhoto } from "@/components/ui/ScrapbookPhoto";

/** Real product photography (brand/PHOTO_INVENTORY.md) — moved here
 * (2026-09-16) from `HeritageBeat`, which used to sandwich this pair
 * between the family photo and the heritage tagline. Content/styling
 * unchanged (same src/alt/dimensions/rotation, same `ScrapbookPhoto`
 * torn-edge treatment) — this was a placement fix, not a redesign: real
 * bar/bonbon shots read as an aside mid-heritage-story, but make sense
 * right before `StoryClosingCta`'s "Shop the Collection" CTA. */
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
 * Small product-photo accent bridging `ClosingPhotoGrid` (black bg) into
 * `StoryClosingCta` (cinnamon bg) — a light `bg-tf-black/5` breath between
 * two saturated blocks, same tone `HeritageBeat` uses for its own quiet
 * beats. Two photos don't warrant a pin/scrub: same lightweight
 * fade-up-on-scroll `HeritageBeat` already uses (no pin, no scrub).
 */
export function ProductPhotoAccent() {
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
    <section ref={sectionRef} className="bg-tf-black/5 px-fluid-md py-fluid-xl">
      <div className="mx-auto grid w-full max-w-xs grid-cols-2 gap-fluid-lg sm:max-w-sm">
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
    </section>
  );
}
