"use client";

import { forwardRef, useRef } from "react";
import type { Ref, SVGProps } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { useMediaPreferences } from "@/lib/hooks/useMediaPreferences";

const STRIPE_COUNT = 5;
const STRIPE_WIDTH = 16; // px — matches StripeDivider's own default stripeWidth
const STRIPE_HEIGHT = 48; // px
const GAP_INDEX = 2; // the middle stripe — the one that shifts to reveal Tom

/**
 * A small "Tom Wuz Here"-style easter egg — see brand/BRAND_REFERENCE.md
 * §4 ("hidden surprise... site footer, a hidden store corner") and §5
 * ("Character in Stripes: a version of the stripe pattern with Tom's eyes
 * peeking out from between the stripes — used for 'fun reveals'") — placed
 * just above the footer as a reward for scrolling all the way down.
 * Deliberately small-scale: a corner detail, not a takeover.
 *
 * Lives just above `<Footer>` rather than inside it: the footer's own
 * background is pure black (see Footer.tsx) and the signature pattern's
 * "black" stripe wouldn't read against that — placing it on the white
 * Story-spine background one section up keeps the black/white stripes
 * actually visible.
 *
 * TODO(brand-assets): swap PeekIcon's hand-drawn placeholder eyes+hat for
 * the real "Tom in stripes" illustration once it's pulled from the brand
 * asset folder (see BRAND_REFERENCE.md Gap 6) — same spot, same size.
 *
 * Reduced motion follows `BrandVideo`'s branch-render pattern: under
 * `prefers-reduced-motion` this renders a completely different, static
 * tree (Tom already peeking, no stripe shift, no GSAP at all) rather than
 * the same DOM with the animation switched off — the moment degrades to
 * decoration instead of disappearing entirely.
 */
export function TomPeek({ className = "" }: { className?: string }) {
  const { prefersReducedMotion } = useMediaPreferences();

  if (prefersReducedMotion) {
    return (
      <div
        className={`relative ${className}`}
        style={{ width: STRIPE_COUNT * STRIPE_WIDTH, height: STRIPE_HEIGHT }}
      >
        <StripeRow />
        <PeekIcon
          className="absolute opacity-100"
          style={{ left: GAP_INDEX * STRIPE_WIDTH, top: -4 }}
        />
      </div>
    );
  }

  return <TomPeekAnimated className={className} />;
}

function TomPeekAnimated({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<HTMLSpanElement>(null);
  const peekRef = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current || !stripeRef.current || !peekRef.current) return;

      gsap.set(stripeRef.current, { x: 0 });
      gsap.set(peekRef.current, { opacity: 0, y: 8 });

      // Not scrubbed — a one-shot narrative beat (shift, peek, hold,
      // retract) that plays once the widget scrolls into view, same
      // `once: true` idea as ProductGridReveal's non-pinned reveal.
      const tl = gsap.timeline({
        scrollTrigger: { trigger: containerRef.current, start: "top 85%", once: true },
      });

      tl.to(stripeRef.current, { x: STRIPE_WIDTH, duration: 0.35, ease: "power2.out" })
        .to(peekRef.current, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, "-=0.15")
        .to({}, { duration: 0.7 }) // hold — Tom lingers before ducking back
        .to(peekRef.current, { opacity: 0, y: 8, duration: 0.25, ease: "power2.in" })
        .to(stripeRef.current, { x: 0, duration: 0.3, ease: "power2.inOut" }, "-=0.1");
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ width: STRIPE_COUNT * STRIPE_WIDTH, height: STRIPE_HEIGHT }}
    >
      <StripeRow shiftRef={stripeRef} />
      <PeekIcon className="absolute" style={{ left: GAP_INDEX * STRIPE_WIDTH, top: -4 }} ref={peekRef} />
    </div>
  );
}

function StripeRow({ shiftRef }: { shiftRef?: Ref<HTMLSpanElement> }) {
  return (
    <div className="absolute inset-0 flex" aria-hidden="true">
      {Array.from({ length: STRIPE_COUNT }).map((_, i) => (
        <span
          key={i}
          ref={i === GAP_INDEX ? shiftRef : undefined}
          className={i % 2 === 0 ? "bg-tf-black" : "bg-tf-white"}
          style={{
            width: STRIPE_WIDTH,
            height: STRIPE_HEIGHT,
            flexShrink: 0,
            position: "relative",
            zIndex: i === GAP_INDEX ? 1 : 0,
          }}
        />
      ))}
    </div>
  );
}

/** Placeholder "OO" eyes + triangular hat — see the TODO above. */
const PeekIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { className?: string }>(
  function PeekIcon({ className = "", style, ...rest }, ref) {
    return (
      <svg
        ref={ref}
        aria-hidden="true"
        width={STRIPE_WIDTH}
        height={28}
        viewBox="0 0 16 28"
        fill="none"
        className={`text-tf-black ${className}`}
        style={style}
        {...rest}
      >
        <path d="M2 12 L8 2 L14 12 Z" fill="currentColor" />
        <circle cx="5.5" cy="19" r="2.5" fill="currentColor" />
        <circle cx="10.5" cy="19" r="2.5" fill="currentColor" />
      </svg>
    );
  }
);
