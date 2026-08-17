"use client";

import { useRef } from "react";
import { PinnedSection } from "@/components/motion/PinnedSection";
import { EyesHatIcon } from "@/components/ui/logos";
import { BrandVideo } from "@/components/media/BrandVideo";
import { gsap } from "@/components/motion/gsap";

/** Generated brand-black frame with a faint stripe texture (same motif as
 * StripeDivider) — stands in as `poster` for `backgroundVideo` until a real
 * encoded clip's own poster is passed via `backgroundVideoPoster`. */
const PLACEHOLDER_POSTER = "/video/hero-placeholder-poster.jpg";

export interface HeroProps {
  /** Base filename (no extension) under `public/video/` for a background
   * brand clip (e.g. a Higgsfield-generated loop) — optional. Omit to keep
   * the plain `bg-tf-black` hero exactly as before; nothing here changes
   * until a real clip lands. Renders behind all existing content via
   * `BrandVideo` with `priority` (loads immediately, no scroll-in gate —
   * it's above the fold by definition) plus a brand-black overlay for text
   * legibility over whatever the clip shows. */
  backgroundVideo?: string;
  /** Poster override for `backgroundVideo` — defaults to a generated
   * brand-black/stripe placeholder so the hero renders correctly even
   * before the real clip's own first-frame poster exists. */
  backgroundVideoPoster?: string;
}

export function Hero({ backgroundVideo, backgroundVideoPoster }: HeroProps = {}) {
  const logoRef = useRef<SVGSVGElement>(null);
  const preheaderRef = useRef<HTMLParagraphElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const accentRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  return (
    <PinnedSection
      className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-tf-black px-fluid-md text-center"
      pinDistance="+=150%"
      scrub={true}
      onTimeline={(tl, { reducedMotion }) => {
        if (reducedMotion) {
          // Simple, non-scroll-tied fade to the final resting state.
          tl.fromTo(
            [logoRef.current, preheaderRef.current, headlineRef.current],
            { opacity: 0 },
            { opacity: 1, duration: 0.8, stagger: 0.15, ease: "power1.out" }
          );
          gsap.set(accentRef.current, { scaleX: 1 });
          gsap.set(cueRef.current, { opacity: 1 });
          return;
        }

        tl.fromTo(
          logoRef.current,
          { opacity: 0, scale: 0.85, y: 24 },
          { opacity: 1, scale: 1, y: 0, duration: 1, ease: "power2.out" }
        )
          .fromTo(
            preheaderRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
            "-=0.4"
          )
          .fromTo(
            headlineRef.current,
            { opacity: 0, y: 32 },
            { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" },
            "-=0.3"
          )
          .fromTo(
            accentRef.current,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 0.6,
              ease: "power2.inOut",
              transformOrigin: "left center",
            },
            "-=0.35"
          )
          .fromTo(
            cueRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.4 },
            "-=0.1"
          )
          .to(cueRef.current, { opacity: 0, duration: 0.3 }, "+=0.3");
      }}
    >
      {backgroundVideo && (
        // Negative z-index, not just DOM order: the icon/preheader/headline
        // below are plain in-flow (non-positioned) elements, and those
        // paint *after* z-index:auto positioned siblings regardless of
        // source order — without -z-10 here this layer would cover the
        // text instead of sitting behind it.
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <BrandVideo
            src={backgroundVideo}
            poster={backgroundVideoPoster ?? PLACEHOLDER_POSTER}
            priority
            className="h-full w-full"
          />
          {/* Brand-black wash so preheader/headline text stays legible over
           * whatever the clip shows — same --tf-black the hero already
           * used as a solid bg, just partially transparent now. */}
          <div className="absolute inset-0 bg-tf-black/35" />
        </div>
      )}

      {/* Icon mark (negative — light ink for the dark hero bg). Sized
       * purely via className so it stays responsive across breakpoints;
       * see logos.tsx for why that means no dev-mode min-size check here
       * (64-80px is comfortably above the 27px minimum regardless). */}
      <EyesHatIcon
        ref={logoRef}
        tone="negative"
        title="Tom Foolery"
        className="mb-fluid-lg h-16 w-auto sm:h-20"
      />

      <p
        ref={preheaderRef}
        className="mb-fluid-sm max-w-xl font-sans text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em] text-tf-white/90"
      >
        Chocolate as interesting as it is irresistible
      </p>

      <h1
        ref={headlineRef}
        className="relative font-display font-semibold text-[length:var(--fs-header)] text-tf-white"
        style={{
          lineHeight: "calc(1em + 16px)",
          // A touch of Fraunces' WONK axis (0–1) — just at the hero, where
          // the size can carry it. 0.5 reads as playful idiosyncrasy, not a
          // full wonky/handwritten swing; opsz keeps auto-tracking font-size
          // via the browser's default optical-sizing behavior, unaffected
          // by this since only "WONK" is set here.
          fontVariationSettings: '"WONK" 0.5',
        }}
      >
        Live a Little
        <span
          ref={accentRef}
          aria-hidden="true"
          className="absolute -bottom-2 left-1/2 h-[3px] w-24 origin-left -translate-x-1/2 scale-x-0 bg-tf-turmeric sm:w-32"
        />
      </h1>

      <div
        ref={cueRef}
        className="absolute bottom-fluid-md left-1/2 flex -translate-x-1/2 flex-col items-center gap-fluid-xs text-tf-white/70 opacity-0"
      >
        <span className="font-sans text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em]">
          Scroll
        </span>
        <span className="h-8 w-px bg-tf-white/40" />
      </div>
    </PinnedSection>
  );
}
