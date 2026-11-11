"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { BodyText } from "@/components/ui/typography";
import { useScrollToGiftingForm } from "@/lib/hooks/useScrollToGiftingForm";
import {
  FAIRE_WHOLESALE_URL,
  WHOLESALE_FORM_ANCHOR,
  WHOLESALE_FORM_FIRST_FIELD,
} from "@/lib/wholesale/constants";

/**
 * Placeholder photography from brand/PHOTO_INVENTORY.md (same situation as
 * GiftingPanels' TODO) — swap each `src` once real wholesale/in-store
 * shots exist. All three have enough resolution for this 3-up grid.
 */
const PANELS = [
  {
    title: "Order on Faire",
    cta: "faire",
    copy: "Browse our full wholesale catalog and order through Faire — with 60-day payment terms and free returns on opening orders for qualifying retailers.",
    image: {
      src: "/photos/raspberry-stacked-bars.jpg",
      alt: "A stack of Tom Foolery chocolate bars",
    },
  },
  {
    title: "Made to Sell Through",
    cta: "shop",
    copy: "Nostalgic flavors, bold colorful wrappers, and real chocolate. Shelf stable for 6 months with no refrigeration — a natural fit for gift shops, boutiques, cafés, bookstores, and specialty grocery.",
    image: {
      src: "/photos/heritage-friends-sharing-chocolate.jpg",
      alt: "Two friends laughing over a bite of chocolate",
    },
  },
  {
    title: "Something Else in Mind?",
    cta: "inquiry",
    copy: "Distributor, hotel, corporate pantry, or ordering at volume? Tell us what you need and we'll put together the right fit.",
    image: {
      src: "/photos/woman-eating-chocolate-pink.jpg",
      alt: "A woman taking a bite of chocolate against a pink background",
    },
  },
] as const;

/**
 * Three-panel "how to carry us" grid — same card shape and reveal as
 * GiftingPanels (stacked mobile, 3-col desktop, staggered fade-up).
 */
export function WholesalePanels() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollToForm = useScrollToGiftingForm(WHOLESALE_FORM_ANCHOR, WHOLESALE_FORM_FIRST_FIELD);

  useGSAP(
    () => {
      const cards = gridRef.current?.querySelectorAll<HTMLElement>("[data-wholesale-panel]");
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
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="px-fluid-md py-fluid-2xl">
      <div ref={gridRef} className="mx-auto grid max-w-6xl grid-cols-1 gap-fluid-xl sm:grid-cols-3">
        {PANELS.map((panel) => (
          <div key={panel.title} data-wholesale-panel className="flex flex-col gap-fluid-sm">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-tf-black/5">
              <Image
                src={panel.image.src}
                alt={panel.image.alt}
                fill
                sizes="(min-width: 640px) 30vw, 90vw"
                className="object-cover"
              />
            </div>
            <h2 className="font-display text-xl font-semibold leading-tight text-fg">{panel.title}</h2>
            <BodyText className="flex-1 text-fg/80">{panel.copy}</BodyText>
            {panel.cta === "faire" ? (
              <a
                href={FAIRE_WHOLESALE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("secondary", "self-start")}
              >
                Shop on Faire
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : panel.cta === "shop" ? (
              <Link href="/shop" className={buttonClasses("secondary", "self-start")}>
                See the Lineup
              </Link>
            ) : (
              <a
                href={`#${WHOLESALE_FORM_ANCHOR}`}
                onClick={scrollToForm}
                className={buttonClasses("secondary", "self-start")}
              >
                Send an Inquiry
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
