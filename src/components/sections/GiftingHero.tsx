"use client";

import { useRef } from "react";
import Image from "next/image";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { useMediaPreferences } from "@/lib/hooks/useMediaPreferences";
import { useScrollToGiftingForm } from "@/lib/hooks/useScrollToGiftingForm";

/**
 * TODO(garrett): placeholder hero photo, AND it's under-resolution for a
 * full-bleed hero — two separate problems, same fix (real shoot photos).
 *
 * 1. Placeholder: the brief pointed at a Google Drive folder of real shoot
 *    photos
 *    (https://drive.google.com/drive/folders/1av5nGRzxRKBbiwM6AcGLiK8z66LrkLYc) —
 *    access to it works fine (confirmed via the Drive connector: readable,
 *    "commenter" link-sharing is on), but as of 2026-09-17 the `Product
 *    Photos > JPG` and `Product Photos > PNG` subfolders it links to are
 *    both genuinely empty — folder structure only, no image files uploaded
 *    yet. Using `philosophy-live-a-little.jpg` instead — real on-brand
 *    photography already in this repo (brand/PHOTO_INVENTORY.md), not a
 *    random external stock photo — until the real shoot photos land.
 *
 * 2. Resolution ceiling (2026-09-22 investigation, prompted by a "hero
 *    looks blurry" report): this file is only 2033×1146 — under the
 *    ~2400px-wide floor a full-bleed `100vw` hero needs, and well under
 *    what any 2x/3x-DPR screen requests at that width. Checked
 *    `public/images/gifting/` for a higher-res original per the brief —
 *    doesn't exist. Re-extracted the source image directly from
 *    `brand/TomFoolery_Brand_Standards_August2026.pdf` (page 48, image 40,
 *    per PHOTO_INVENTORY.md's citation) to check for a larger embed than
 *    what's in `public/photos/` — byte-identical, 2033×1146. That
 *    resolution is the PDF's own ceiling for this photo, not an
 *    extra-downscale artifact of this repo's pipeline (PHOTO_INVENTORY's
 *    "capped at 2200px" note didn't even apply here — this file was
 *    already under that cap). No higher-res source exists anywhere in the
 *    repo to swap in. Not upscaling it — `quality`/`sizes` below squeeze
 *    what's fetchable out of the existing pixels, but real photography
 *    (Drive folder above) is the only actual fix.
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
  const scrollToForm = useScrollToGiftingForm();

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
          quality={85}
          sizes="100vw"
          // Default (50% 50%) crops the subject (woman + chocolate bar,
          // both sitting right-of-center in frame — see the source file)
          // almost entirely out of the tall, narrow window `object-cover`
          // has to work with on mobile, leaving only empty backdrop.
          // Biased right + slightly high keeps her face and the bar in
          // frame from the narrowest mobile crop up through desktop.
          className="object-cover object-[78%_22%]"
        />
        {/* Radial scrim, not a flat wash over the whole photo (that was
         * the old `bg-tf-black/50` here) — content is vertically centered
         * (`items-center` above) at every breakpoint, so a scrim centered
         * the same way guarantees contrast exactly where the text sits
         * while leaving the photo's corners visible and vivid. On mobile
         * the text column runs nearly edge-to-edge (`max-w-2xl` doesn't
         * kick in below that width, so there's little photo left "outside
         * the text" anyway); it only pulls back into a true accent on
         * wider screens, where `max-w-2xl` is a much smaller fraction of
         * the full-bleed section. Values tuned against actual measured
         * text bounding boxes and sampled backdrop pixels (both the
         * darker mauve center and the pale pink/cream margins behind the
         * preheader) to clear WCAG AA's 4.5:1 for white text at every
         * corner of the content block, at every tested breakpoint
         * (375–1440px) — see this file's git history for the math.
         * rgba(37,56,42,…) is `--tf-black`/`#25382A` in decimal — a CSS
         * gradient can't reference a custom property inside `rgba()`
         * without the newer `rgb(from var(...) ...)` relative-color
         * syntax, so this is the same brand black spelled out by hand,
         * not an off-palette color. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 75% 70% at 50% 50%, rgba(37,56,42,0.82) 0%, rgba(37,56,42,0.72) 55%, rgba(37,56,42,0.48) 85%, rgba(37,56,42,0.18) 100%)",
          }}
        />
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
        <a
          href="#gifting-form"
          onClick={scrollToForm}
          className={buttonClasses("primary", "mt-fluid-sm")}
        >
          Learn More
        </a>
      </div>
    </section>
  );
}
