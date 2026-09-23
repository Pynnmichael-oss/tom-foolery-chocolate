"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { BodyText } from "@/components/ui/typography";

/**
 * TODO(garrett): placeholder panel photos — same situation as
 * `GiftingHero`'s TODO (the linked Drive folder is currently empty, see
 * that comment for the full note). These three are real on-brand
 * photography already in this repo (brand/PHOTO_INVENTORY.md), not
 * external stock: two were sitting unwired as backups, the third
 * (`citrus-filled-bar-green.jpg`) is also used in `/story`'s closing
 * photo grid — reusing it here isn't a conflict (different page, and
 * it's explicitly placeholder photography either way), just the most
 * on-brand option available until the real shoot photos land. Swap each
 * `src` below once they do.
 *
 * Resolution audit (2026-09-22, alongside the hero's own): the flatlay
 * (1241×2200) has plenty of headroom for this grid. The other two
 * (`truffles-turmeric-background.jpg`, `citrus-filled-bar-green.jpg`) are
 * only 545–546px wide — comfortable for the 3-column desktop grid
 * (~150–300px rendered columns even at 2–3x DPR), but right at the edge
 * of what a 2–3x-DPR phone asks for at mobile's single-column ~90vw width.
 * Same story as the hero: no higher-res original exists in the repo to
 * swap in, and it's not severe enough to justify upscaling two placeholder
 * photos that are getting replaced anyway — noted here so it isn't
 * mistaken for an oversight if it comes up again before the real shoot
 * photos land.
 */
const PANELS = [
  {
    title: "Custom & Branded",
    copy: "Truly personalize your gift & show off your brand with custom packaging, special chocolate assortments, and more",
    image: {
      src: "/photos/craft-hazelnut-bar-flatlay.jpg",
      alt: "Overhead view of a hazelnut chocolate bar broken into pieces",
      width: 1241,
      height: 2200,
    },
  },
  {
    title: "Weddings & Events",
    copy: "Take your event to the next level with custom bon bon towers, personalized chocolate bars, and so much more",
    image: {
      src: "/photos/truffles-turmeric-background.jpg",
      alt: "Five bonbons arranged vertically on a turmeric-orange background",
      width: 545,
      height: 727,
    },
  },
  {
    title: "Ready to Ship",
    copy: "In a rush? We offer options that are ready to ship and are perfect for the last minute gift.",
    image: {
      src: "/photos/citrus-filled-bar-green.jpg",
      alt: "A chocolate bar broken open, revealing a citrus-marmalade filling",
      width: 546,
      height: 727,
    },
  },
] as const;

/**
 * Three-panel "what kind of gifting" grid — stacked mobile, 3-col desktop.
 * Same card shape and scroll-reveal recipe `FeaturedProductsReveal` uses
 * (image top, copy below, staggered fade-up), swapping its price line for
 * a CTA into the inquiry form — this page's whole point is getting
 * someone to that form, so every panel gets its own way in, not just the
 * hero.
 */
export function GiftingPanels() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gridRef.current?.querySelectorAll<HTMLElement>("[data-gifting-panel]");
      if (!cards || cards.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add(breakpoints.reducedMotion, () => {
        gsap.set(cards, { opacity: 1, y: 0 });
      });

      mm.add(breakpoints.motionOK, () => {
        gsap.set(cards, { opacity: 0, y: 32 });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        });
        tl.to(cards, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.1 });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="px-fluid-md py-fluid-2xl">
      <div
        ref={gridRef}
        className="mx-auto grid max-w-6xl grid-cols-1 gap-fluid-xl sm:grid-cols-3"
      >
        {PANELS.map((panel) => (
          <div key={panel.title} data-gifting-panel className="flex flex-col gap-fluid-sm">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-tf-black/5">
              <Image
                src={panel.image.src}
                alt={panel.image.alt}
                fill
                sizes="(min-width: 640px) 30vw, 90vw"
                className="object-cover"
              />
            </div>
            {/* h2, not h3: unlike FeaturedProductsReveal's matching card
             * pattern (whose cards nest under that section's own h2),
             * this section has no wrapping heading of its own — these
             * three are top-level page sections in the outline, so they
             * sit at the same level as GiftingForm's "Let's Plan Your
             * Gift" heading below, not nested under it. */}
            <h2 className="font-display text-xl font-semibold leading-tight text-fg">
              {panel.title}
            </h2>
            <BodyText className="flex-1 text-fg/80">{panel.copy}</BodyText>
            <a href="#gifting-form" className={buttonClasses("secondary", "self-start")}>
              Learn More
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
