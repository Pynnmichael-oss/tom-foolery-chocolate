"use client";

import { useRef } from "react";
import { gsap, useGSAP, breakpoints } from "./gsap";

export interface PinnedSectionTimelineContext {
  /** True when the user prefers reduced motion — the timeline this run
   * builds has no ScrollTrigger/pin attached and should just play once. */
  reducedMotion: boolean;
}

export interface PinnedSectionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Passed straight to ScrollTrigger's `scrub`. */
  scrub?: boolean | number;
  /** Passed straight to ScrollTrigger's `end`. */
  pinDistance?: string;
  /** Whether the section pins while scrubbing. */
  pin?: boolean;
  /** Build your animation into the provided timeline. */
  onTimeline?: (
    timeline: gsap.core.Timeline,
    context: PinnedSectionTimelineContext
  ) => void;
}

/**
 * Reusable scroll-pinned section. Wraps `useGSAP` + `ScrollTrigger` and
 * hands the caller a timeline to build into via `onTimeline`. Cleans itself
 * up automatically (gsap.context revert via useGSAP + matchMedia revert).
 * Under `prefers-reduced-motion`, no ScrollTrigger/pin is created at all —
 * the callback receives a plain, immediately-playing timeline instead.
 */
export function PinnedSection({
  children,
  className,
  style,
  scrub = true,
  pinDistance = "+=150%",
  pin = true,
  onTimeline,
}: PinnedSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current || !onTimeline) return;

      const mm = gsap.matchMedia();

      mm.add(breakpoints.reducedMotion, () => {
        onTimeline(gsap.timeline(), { reducedMotion: true });
      });

      mm.add(breakpoints.motionOK, () => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: pinDistance,
            scrub,
            pin,
            anticipatePin: 1,
          },
        });

        onTimeline(timeline, { reducedMotion: false });

        return () => {
          timeline.scrollTrigger?.kill();
          timeline.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [pinDistance, scrub, pin] }
  );

  return (
    <div ref={containerRef} className={className} style={style}>
      {children}
    </div>
  );
}
