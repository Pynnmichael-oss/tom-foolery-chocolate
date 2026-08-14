"use client";

import { useRef } from "react";
import { PinnedSection } from "@/components/motion/PinnedSection";
import { gsap } from "@/components/motion/gsap";

export function Hero() {
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
      {/* Inline SVG logo placeholder — light/negative mark for the dark hero bg. */}
      <svg
        ref={logoRef}
        viewBox="0 0 120 120"
        role="img"
        aria-label="Tom Foolery Chocolate mark"
        className="mb-fluid-lg h-16 w-16 text-tf-white sm:h-20 sm:w-20"
        fill="none"
      >
        <circle cx="60" cy="60" r="56" stroke="currentColor" strokeWidth="3" />
        <path
          d="M38 74c6-20 14-32 22-32s16 12 22 32"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="60" cy="42" r="6" fill="currentColor" />
      </svg>

      <p
        ref={preheaderRef}
        className="mb-fluid-sm max-w-xl font-sofia text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.2em] text-tf-white/90"
      >
        Chocolate as interesting as it is irresistible
      </p>

      <h1
        ref={headlineRef}
        className="relative font-featureDeck text-[length:var(--fs-header)] leading-[0.95] text-tf-white"
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
        <span className="font-sofia text-[length:var(--fs-preheader)] uppercase tracking-[0.3em]">
          Scroll
        </span>
        <span className="h-8 w-px bg-tf-white/40" />
      </div>
    </PinnedSection>
  );
}
