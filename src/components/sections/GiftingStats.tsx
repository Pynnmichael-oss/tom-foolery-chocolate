"use client";

import { useRef } from "react";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { Preheader } from "@/components/ui/typography";

/** Same three facts as before (see git history for the original full-
 * sentence phrasing) — distilled into a short ALL CAPS label + a big
 * standalone number, per the brief's "numbers as the big statement,
 * labels as ALL CAPS preheaders" ask. The underlying figures are
 * untouched, only the presentation split. */
const STATS: Array<{ label: string; value: string; suffix?: string }> = [
  { label: "Starting At", value: "$10" },
  { label: "Order Size", value: "20 – 2,000+", suffix: "units" },
  { label: "Turnaround", value: "24", suffix: "hours" },
];

/**
 * Reassurance band between the panels and the inquiry form — a trust-bar
 * row, not a data section, so it stays plain: no card chrome, just three
 * stacked label/number pairs divided by hairlines at sm+ (stacked,
 * undivided on mobile). Same lightweight fade-up-on-scroll
 * `GiftingPanels`/`HeritageBeat` already use.
 */
export function GiftingStats() {
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
          duration: 0.7,
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
    <section ref={sectionRef} className="bg-tf-black/5 px-fluid-md py-fluid-2xl">
      <div className="mx-auto flex max-w-4xl flex-col divide-y divide-tf-black/15 sm:flex-row sm:divide-x sm:divide-y-0">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-1 flex-col items-center gap-fluid-xs px-fluid-md py-fluid-md text-center"
          >
            <Preheader className="text-fg/60">{stat.label}</Preheader>
            {/* min-height reserves room for the two-line wrap "20 – 2,000+"
             * needs in its (narrower, 3-up) desktop column — without it,
             * that one stat sits taller than its one-line siblings and
             * knocks every "units"/"hours" caption below out of line with
             * each other. Sized in em off the value's own fluid font-size
             * so it stays correctly proportioned at every breakpoint. */}
            <p
              className="flex min-h-[2.2em] items-center justify-center font-display font-semibold leading-[1.1] text-tf-cinnamon-strong"
              style={{ fontSize: "clamp(2rem, 1.6rem + 2.25vw, 3.25rem)" }}
            >
              {stat.value}
            </p>
            <p className="font-sans text-sm text-fg/60" aria-hidden={!stat.suffix}>
              {stat.suffix ?? " "}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
