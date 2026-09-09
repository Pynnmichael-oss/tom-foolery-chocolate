"use client";

import { useRef } from "react";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { Preheader, BodyText } from "@/components/ui/typography";

/**
 * Quiet, grounded beat between StoryHero's exuberance and the "Live a
 * Little" pinned statement — deliberately plain: a single soft fade-up
 * as it enters view, no pin, no scrub, no display type. A breath, not a
 * beat, on purpose — the contrast is the point.
 */
export function HeritageBeat() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const mm = gsap.matchMedia();

      mm.add(breakpoints.reducedMotion, () => {
        gsap.set(sectionRef.current, { opacity: 1, y: 0 });
      });

      mm.add(breakpoints.motionOK, () => {
        gsap.set(sectionRef.current, { opacity: 0, y: 16 });

        const tween = gsap.to(sectionRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 85%" },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="bg-tf-black/5 px-fluid-md py-fluid-2xl text-center">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-fluid-sm">
        <Preheader className="text-fg/60">Heritage</Preheader>
        {/*
         * TODO(garrett): placeholder copy. Swap for the real founder/family
         * story once Garrett provides the actual three-generations detail
         * (names, decade, what specifically got handed down) — see the
         * conversation this section was built in. Keep this beat's quieter,
         * grounded register even once real copy lands; it's a deliberate
         * contrast to StoryHero's exuberance and shouldn't get louder.
         */}
        <BodyText size="lg" className="text-fg/80">
          Built on three generations of tradition &amp; handcrafted for
          maximal enjoyment.
        </BodyText>
      </div>
    </section>
  );
}
