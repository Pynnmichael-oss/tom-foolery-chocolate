"use client";

import { useRef } from "react";
import Image from "next/image";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { useMediaPreferences } from "@/lib/hooks/useMediaPreferences";
import { useScrollToGiftingForm } from "@/lib/hooks/useScrollToGiftingForm";
import { GiftingHeroGraphic } from "./GiftingHeroGraphic";

export interface HeroImageSource {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** CSS `object-position` (e.g. `"78% 22%"`) — plain inline style, not a
   * Tailwind `object-[...]` class: Tailwind's JIT scanner needs a literal
   * class string at build time to generate CSS for it, and can't see a
   * value assembled from a prop at runtime. Omit for the browser default
   * (`"50% 50%"`, dead center). */
  objectPosition?: string;
}

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
 *
 * SWAP POINT (2026-09-28 audit — see docs/gifting-hero-image-audit.md for
 * the full candidate list with dimensions/file sizes): when real
 * photography lands, update these two defaults, not the `Image` JSX below
 * — `desktopImage`/`mobileImage` (GiftingHeroProps) already support two
 * genuinely different sources with independent crops now, so a real
 * mobile-specific photo (portrait-leaning, or just a different crop) can
 * go straight into DEFAULT_MOBILE_IMAGE without another refactor. Until
 * then this defaults to the exact same photo as desktop, same crop —
 * zero art direction yet, just the plumbing for it.
 */
const DEFAULT_DESKTOP_IMAGE: HeroImageSource = {
  src: "/photos/philosophy-live-a-little.jpg",
  alt: "A woman laughing and holding up a chocolate bar",
  width: 2033,
  height: 1146,
  // Default (50% 50%) crops the subject (woman + chocolate bar, both
  // sitting right-of-center in frame — see the source file) almost
  // entirely out of the tall, narrow window `object-cover` has to work
  // with on mobile, leaving only empty backdrop. Biased right + slightly
  // high keeps her face and the bar in frame from the narrowest mobile
  // crop up through desktop — a stand-in for real mobile art direction,
  // not a substitute for it (see the TODO above).
  objectPosition: "78% 22%",
};

const DEFAULT_MOBILE_IMAGE: HeroImageSource = DEFAULT_DESKTOP_IMAGE;

export interface GiftingHeroProps {
  /** `"photo"` — the original full-bleed photo hero (uses `desktopImage`/
   * `mobileImage`). `"graphic"` — brand-ground text panel + CSS stripe
   * field with the product cutout (see GiftingHeroGraphic.tsx; ignores the
   * image props). Defaults to `"photo"` here so existing callers are
   * untouched; the gifting page opts into `"graphic"` explicitly. */
  variant?: "photo" | "graphic";
  /** Graphic variant only — ground color of the text panel. Defaults to
   * brand rose. */
  groundColor?: string;
  /** Desktop/tablet hero image — rendered at the `sm:` breakpoint (640px)
   * and up. Defaults to the current placeholder photo; see the TODO
   * above for the real swap-in plan. */
  desktopImage?: HeroImageSource;
  /** Mobile hero image — rendered below `sm:`. Defaults to `desktopImage`
   * itself (today, that's literally `DEFAULT_MOBILE_IMAGE === DEFAULT_-
   * DESKTOP_IMAGE`, the same object) — when it resolves to the exact same
   * `src` as `desktopImage`, only one `<Image>` renders (not two fetching
   * the same file under different `hidden`/`sm:hidden` classes), so
   * passing nothing here costs nothing extra over the single-image
   * version this component used to be. Pass a genuinely different source
   * to get true art-directed responsive images. */
  mobileImage?: HeroImageSource;
}

/**
 * Corporate Gifting hero — a static full-bleed photo (no pin/scrub; this
 * is a straightforward landing page, not the flagship homepage/story
 * treatment) with a one-time fade-up on mount — fires immediately, no
 * ScrollTrigger needed since this is always in view at load.
 */
export function GiftingHero({
  variant = "photo",
  groundColor,
  desktopImage,
  mobileImage,
}: GiftingHeroProps = {}) {
  if (variant === "graphic") return <GiftingHeroGraphic groundColor={groundColor} />;
  return <GiftingHeroPhoto desktopImage={desktopImage} mobileImage={mobileImage} />;
}

function GiftingHeroPhoto({
  desktopImage = DEFAULT_DESKTOP_IMAGE,
  mobileImage = DEFAULT_MOBILE_IMAGE,
}: Pick<GiftingHeroProps, "desktopImage" | "mobileImage">) {
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

  // Only render a second <Image> when there's genuinely a different photo
  // to show — comparing `src` (not object identity) so a caller passing
  // an equivalent-but-freshly-created object for both props still
  // collapses to one image, same as the (identity-equal) defaults do.
  const hasDistinctMobileImage = mobileImage.src !== desktopImage.src;

  return (
    <section className="relative flex min-h-[70vh] w-full items-center justify-center overflow-hidden bg-tf-black px-fluid-md py-fluid-2xl text-center sm:min-h-[85vh]">
      <div aria-hidden="true" className="absolute inset-0">
        {hasDistinctMobileImage && (
          <Image
            src={mobileImage.src}
            alt=""
            fill
            priority
            quality={85}
            sizes="100vw"
            className="object-cover sm:hidden"
            style={{ objectPosition: mobileImage.objectPosition ?? "50% 50%" }}
          />
        )}
        <Image
          src={desktopImage.src}
          alt=""
          fill
          priority
          quality={85}
          sizes="100vw"
          className={hasDistinctMobileImage ? "hidden object-cover sm:block" : "object-cover"}
          style={{ objectPosition: desktopImage.objectPosition ?? "50% 50%" }}
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
