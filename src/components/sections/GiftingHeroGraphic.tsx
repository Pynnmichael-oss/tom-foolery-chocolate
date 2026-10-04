"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { EyesHatIcon } from "@/components/ui/logos";
import { useScrollToGiftingForm } from "@/lib/hooks/useScrollToGiftingForm";

export interface GiftingHeroGraphicProps {
  /** Ground color of the text panel — defaults to brand rose. Text on it
   * is always brand black (#25382A): 6.7:1 on rose, but check contrast
   * (WCAG AA, 4.5:1) before passing anything darker than the palette's
   * light accents (rose, juniper, turmeric all clear it). */
  groundColor?: string;
}

/**
 * Cutout of the Coffee & Cookies bar, derived from the studio original on
 * Shopify (already a photographer-supplied transparent cutout — see
 * public/photos/source/, git-ignored). Baked-in shadow stripped; the drop
 * shadow below is a CSS filter so it follows the rotated silhouette.
 *
 * TODO(assets): swap for a proper studio cutout of whichever product the
 * page should feature — same filename keeps this call site untouched.
 */
const PRODUCT = {
  src: "/photos/gifting-bar-cutout.png",
  alt: "Tom Foolery Coffee & Cookies chocolate bar in its black-and-white striped wrapper",
  width: 1600,
  height: 950,
} as const;

// 55px stripes, brand black/white only (BRAND_REFERENCE §5: stripes are
// never rendered in an accent color). Horizontal, so the gradient runs
// top→bottom (180deg).
const STRIPE_FIELD =
  "repeating-linear-gradient(180deg, var(--tf-black) 0 55px, var(--tf-white) 55px 110px)";

/** Wavy white "ground" Tom peeks over. Fills to the bottom edge, so anything
 * drawn behind it (Tom) is hidden below the crest with no clipping box. */
function WaveGround({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 60"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M0 30 C 25 6, 50 6, 75 30 S 125 54, 150 30 S 200 6, 225 30 S 275 54, 300 30 S 350 6, 375 30 S 425 54, 450 30 S 500 6, 525 30 S 575 54, 600 30 L600 60 L0 60 Z"
        fill="var(--tf-white)"
      />
    </svg>
  );
}

const CTA_BASE =
  "inline-flex items-center justify-center rounded-full border-2 border-tf-black px-fluid-md py-fluid-sm " +
  "font-sans text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em] cursor-pointer " +
  "transition-transform duration-200 ease-out " +
  "motion-safe:hover:-rotate-1 motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-black focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

/**
 * Graphic variant of the Gifting hero: brand-ground text panel +
 * black/white stripe field (pure CSS) with the product cutout straddling
 * the seam. Desktop (≥1024px) is a ~61/39 side-by-side split with the seam
 * vertical; below that it stacks, text on top and a ~330px stripe band
 * below, with the seam horizontal. The product is a child of the stripe
 * panel positioned on its leading edge, so "the seam" is just that edge in
 * both layouts — one element, two placements, no duplicated markup.
 *
 * Motion (GSAP, transform/opacity only) runs only under
 * `prefers-reduced-motion: no-preference`; otherwise nothing is touched
 * and the page is its final static state. The hidden/offset starting state
 * is plain CSS (globals.css, `html.js [data-hero=…]`) so it's in place
 * before first paint; GSAP only animates *to* the resting state. The
 * static rotations on the product/badge sit on inner wrappers so the
 * animated outer elements only ever carry the entrance transform.
 */
export function GiftingHeroGraphic({ groundColor = "var(--tf-rose)" }: GiftingHeroGraphicProps) {
  const rootRef = useRef<HTMLElement>(null);
  const scrollToForm = useScrollToGiftingForm();

  useGSAP(
    () => {
      const q = <T extends Element>(sel: string) => rootRef.current?.querySelector<T>(sel) ?? null;
      const mm = gsap.matchMedia();

      mm.add(breakpoints.motionOK, () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        // Every `from` object below mirrors the pre-paint CSS in
        // globals.css (`html.js [data-hero=…]`) — so when this runs
        // post-hydration, "from" is already what's on screen and nothing
        // jumps. Text rises via transform; only the supporting elements
        // fade. The headline is deliberately transform-only (LCP: it must
        // paint visible immediately).
        const rise = (sel: string, fade: boolean, at: number) =>
          tl.fromTo(
            q(sel),
            fade ? { y: 28, opacity: 0 } : { y: 28 },
            fade ? { y: 0, opacity: 1, duration: 0.7 } : { y: 0, duration: 0.7 },
            at
          );
        rise("[data-hero=pre]", true, 0);
        rise("[data-hero=title]", false, 0.12);
        rise("[data-hero=sub]", true, 0.24);
        rise("[data-hero=cta]", true, 0.36);

        // Product deliberately slides via transform only (no opacity):
        // it's a large above-the-fold image, and fading it from 0 would
        // push its paint — and potentially LCP — later for no visual gain.
        // `rotation` is an *offset* on top of the static -9deg, which lives
        // on the inner wrapper so it never fights this transform.
        tl.fromTo(
          q("[data-hero=product]"),
          { x: 160, rotation: 10 },
          { x: 0, rotation: 0, duration: 0.95, ease: "back.out(1.5)" },
          0.2
        )
          .fromTo(
            q("[data-hero=badge]"),
            { scale: 0, rotation: -60 },
            { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2.2)" },
            "-=0.1"
          )
          // Single, delayed peek: rises from behind the wave once. `y: 0`
          // is explicit because GSAP reads the CSS starting transform
          // (translateY(105%)) as a pixel `y`; without pinning it, that
          // pixel offset would survive the yPercent tween.
          .fromTo(
            q("[data-hero=tom]"),
            { y: 0, yPercent: 105 },
            { yPercent: 0, duration: 0.55, ease: "power2.out" },
            "+=0.5"
          );

        return () => {
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: rootRef }
  );

  return (
    <section
      ref={rootRef}
      className="relative flex w-full flex-col overflow-x-clip text-tf-black lg:min-h-[max(640px,calc(100dvh-5.25rem))] lg:flex-row"
    >
      {/* Text panel */}
      <div
        className="relative z-10 flex flex-col justify-center px-fluid-md pb-[calc(var(--space-xl)+7.5rem)] pt-fluid-2xl lg:basis-[61%] lg:px-[clamp(2rem,5vw,5rem)] lg:pb-fluid-2xl"
        style={{ backgroundColor: groundColor }}
      >
        <div className="flex max-w-[34rem] flex-col items-start gap-fluid-md lg:max-w-[36rem]">
          <p
            data-hero="pre"
            className="font-sans text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em]"
          >
            Gifting
          </p>
          <h1
            data-hero="title"
            className="font-display font-semibold"
            style={{ fontSize: "clamp(3.5rem, 2.2rem + 5.6vw, 6.5rem)", lineHeight: 0.95 }}
          >
            Give a little mischief.
          </h1>
          <p data-hero="sub" className="max-w-md font-sans text-[length:var(--fs-body)] leading-snug">
            Stand out from the crowd with a unique, personalized gift for any occasion.
          </p>
          <div data-hero="cta" className="mt-fluid-xs flex flex-wrap gap-fluid-sm">
            <Link
              href="/collections/gifts"
              className={`${CTA_BASE} bg-tf-black text-tf-white`}
            >
              Shop Gifts
            </Link>
            <a
              href="#custom-gift"
              onClick={scrollToForm}
              className={`${CTA_BASE} bg-transparent text-tf-black hover:bg-tf-black/10`}
            >
              Make It Custom
            </a>
          </div>
        </div>
      </div>

      {/* Stripe panel. Not overflow-hidden — the product hangs over its
       * leading edge into the text panel. The stripes themselves live on
       * an inset child so only *they* are clipped. */}
      <div className="relative h-[330px] lg:h-auto lg:basis-[39%]">
        <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: STRIPE_FIELD }} />

        {/* Ground + Tom peeking over a wavy stripe (bottom of the panel) */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[92px] bg-tf-black lg:h-[150px]">
          <div className="absolute bottom-[26%] right-[14%] w-[54px] lg:w-[84px]" data-hero="tom">
            <EyesHatIcon tone="negative" className="block h-auto w-full" />
          </div>
          <WaveGround className="absolute inset-x-0 bottom-0 h-[52%] w-full" />
        </div>

        {/* Product + badge, centered on the seam: top-center on mobile,
         * left-middle on desktop. */}
        <div className="absolute left-1/2 top-0 z-20 w-[min(82vw,22rem)] -translate-x-1/2 -translate-y-[52%] lg:left-0 lg:top-[57%] lg:w-[clamp(20rem,33vw,34rem)] lg:-translate-y-1/2">
          <div data-hero="product">
            <div className="-rotate-9">
              <Image
                src={PRODUCT.src}
                alt={PRODUCT.alt}
                width={PRODUCT.width}
                height={PRODUCT.height}
                priority
                quality={85}
                sizes="(min-width: 1024px) 33vw, 82vw"
                className="h-auto w-full"
                style={{ filter: "drop-shadow(0 22px 24px rgba(37, 56, 42, 0.38))" }}
              />
            </div>
          </div>
          {/* Badge: its own element so it pops in on its own timing rather
           * than riding the product's slide. */}
          <div
            data-hero="badge"
            className="absolute -right-[4%] -top-[14%] size-[clamp(5.5rem,9vw,8.25rem)]"
          >
            <div className="flex size-full rotate-12 items-center justify-center rounded-full bg-tf-turmeric text-center">
              <span className="font-display text-[clamp(1.05rem,1.7vw,1.6rem)] font-semibold leading-[1.02]">
                Live a<br />Little
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
