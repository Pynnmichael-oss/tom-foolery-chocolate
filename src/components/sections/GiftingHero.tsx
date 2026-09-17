"use client";

import { useRef } from "react";
import Image from "next/image";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { useMediaPreferences } from "@/lib/hooks/useMediaPreferences";

/**
 * TODO(garrett): placeholder hero photo. The brief pointed at a Google
 * Drive folder of real shoot photos
 * (https://drive.google.com/drive/folders/1av5nGRzxRKBbiwM6AcGLiK8z66LrkLYc) —
 * access to it works fine (confirmed via the Drive connector: readable,
 * "commenter" link-sharing is on), but as of 2026-09-17 the `Product
 * Photos > JPG` and `Product Photos > PNG` subfolders it links to are
 * both genuinely empty — folder structure only, no image files uploaded
 * yet. Using `philosophy-live-a-little.jpg` instead — real on-brand
 * photography already in this repo (brand/PHOTO_INVENTORY.md), a
 * landscape crop with real headroom for a full-bleed hero, not a random
 * external stock photo — until the real shoot photos land in that Drive
 * folder. Swap the `src` below once they do; no other change needed here.
 */
const HERO_IMAGE = {
  src: "/photos/philosophy-live-a-little.jpg",
  alt: "A woman laughing and holding up a chocolate bar",
  width: 2033,
  height: 1146,
} as const;

/**
 * Corporate Gifting hero — a static full-bleed photo (no pin/scrub; this
 * is a straightforward landing page, not the flagship homepage/story
 * treatment) with a one-time fade-up on mount, same lightweight recipe
 * `EmailSignupPopup` uses for its own entrance (fires immediately, no
 * ScrollTrigger needed since this is always in view at load).
 */
export function GiftingHero() {
  const contentRef = useRef<HTMLDivElement>(null);
  const { prefersReducedMotion } = useMediaPreferences();

  useGSAP(
    () => {
      if (!contentRef.current) return;

      if (prefersReducedMotion) {
        gsap.set(contentRef.current, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );
    },
    { dependencies: [prefersReducedMotion] }
  );

  return (
    <section className="relative flex min-h-[70vh] w-full items-center justify-center overflow-hidden bg-tf-black px-fluid-md py-fluid-2xl text-center sm:min-h-[85vh]">
      <div aria-hidden="true" className="absolute inset-0">
        <Image
          src={HERO_IMAGE.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Same brand-black wash Hero.tsx uses over its own background
         * media — keeps white text legible over whatever the photo shows. */}
        <div className="absolute inset-0 bg-tf-black/50" />
      </div>

      <div
        ref={contentRef}
        className="relative z-10 flex max-w-2xl flex-col items-center gap-fluid-md"
      >
        <Preheader className="text-tf-white/80">Corporate Gifting</Preheader>
        <Headline as="h1" size="md" className="text-tf-white">
          Clever &amp; curious gifts for clients, guests, &amp; more
        </Headline>
        <BodyText size="lg" className="text-tf-white/90">
          Stand out from the crowd with a unique, personalized gift for any occasion.
        </BodyText>
        <a href="#gifting-form" className={buttonClasses("primary", "mt-fluid-sm")}>
          Learn More
        </a>
      </div>
    </section>
  );
}
