"use client";

import { useRef } from "react";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";

/** Each stat's exact given phrasing, split only so the numeric/key part can
 * be bolded for a little visual hierarchy — wording itself is untouched. */
const STATS: Array<{ prefix: string; bold: string; suffix?: string }> = [
  { prefix: "Gifts starting at ", bold: "$10" },
  { prefix: "Orders from ", bold: "20 – 2,000+", suffix: " units" },
  { prefix: "Turnaround in as little as ", bold: "24 hours" },
];

/**
 * Simple reassurance band between the panels and the inquiry form — a
 * trust-bar row, not a data section, so it stays plain: no card chrome,
 * just three phrases divided by hairlines at sm+ (stacked, undivided on
 * mobile). Same lightweight fade-up-on-scroll `GiftingPanels`/
 * `HeritageBeat` already use.
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
    <section ref={sectionRef} className="bg-tf-black/5 px-fluid-md py-fluid-xl">
      <div className="mx-auto flex max-w-4xl flex-col divide-y divide-tf-black/15 sm:flex-row sm:divide-x sm:divide-y-0">
        {STATS.map((stat) => (
          <div
            key={stat.bold}
            className="flex-1 px-fluid-md py-fluid-sm text-center font-display text-lg text-fg sm:text-xl"
          >
            {stat.prefix}
            <strong className="font-semibold text-tf-cinnamon-strong">{stat.bold}</strong>
            {stat.suffix}
          </div>
        ))}
      </div>
    </section>
  );
}
