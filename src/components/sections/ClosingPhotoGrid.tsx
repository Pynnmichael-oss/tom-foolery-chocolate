"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { StripeDivider } from "@/components/ui/StripeDivider";

interface GridPhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** Real product/lifestyle photography (brand/PHOTO_INVENTORY.md) — the
 * four backup photos not otherwise wired into the site, per that file's
 * "kept as backups" table. */
const PHOTOS: GridPhoto[] = [
  {
    src: "/photos/raspberry-stacked-bars.jpg",
    alt: "Stacked dark chocolate bars with raspberry filling bleeding down the stack",
    width: 2200,
    height: 1235,
  },
  {
    src: "/photos/kid-chocolate-face-coral.jpg",
    alt: "A kid grinning with chocolate smeared on their face, coral background",
    width: 2200,
    height: 1240,
  },
  {
    src: "/photos/woman-eating-chocolate-pink.jpg",
    alt: "A woman biting into a square of chocolate, pink background",
    width: 546,
    height: 727,
  },
  {
    src: "/photos/citrus-filled-bar-green.jpg",
    alt: "A chocolate bar broken open, revealing a citrus-marmalade filling",
    width: 546,
    height: 727,
  },
];

/**
 * Real product/lifestyle photography in a simple grid, framed top and
 * bottom by the brand's stripe motif (reuses `StripeDivider` rather than
 * re-implementing the pattern) — bridges into `StoryClosingCta`'s pinned
 * statement directly below. Plain scroll-into-view stagger, no pin, same
 * shape as `FeaturedProductsReveal`'s card grid since this plays the same
 * "grid gallery" role.
 */
export function ClosingPhotoGrid() {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gridRef.current?.querySelectorAll<HTMLElement>("[data-grid-photo]");
      if (!cards || cards.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add(breakpoints.reducedMotion, () => {
        gsap.set(cards, { opacity: 1, y: 0 });
      });

      mm.add(breakpoints.motionOK, () => {
        gsap.set(cards, { opacity: 0, y: 24 });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: gridRef.current, start: "top 80%" },
        });
        tl.to(cards, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.1 });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: gridRef }
  );

  return (
    <div className="bg-tf-black">
      <StripeDivider stripeWidth={14} />

      <div ref={gridRef} className="grid grid-cols-2 gap-[2px] sm:grid-cols-4">
        {PHOTOS.map((photo) => (
          <div key={photo.src} data-grid-photo className="relative aspect-square overflow-hidden">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 640px) 25vw, 50vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <StripeDivider stripeWidth={14} />
    </div>
  );
}
