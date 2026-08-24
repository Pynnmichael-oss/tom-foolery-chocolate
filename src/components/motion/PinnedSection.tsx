"use client";

import { useRef } from "react";
import { gsap, useGSAP, breakpoints } from "./gsap";

/**
 * `will-change` on every element the timeline actually animates — pulled
 * straight from the timeline's own tweens (`getChildren` + `targets()`,
 * both public GSAP APIs) rather than requiring each caller to hand back
 * refs, so Hero/StorySection/BrandCompass all get this for free. Set on
 * `onEnter`/`onEnterBack` (right before the heaviest part of a scrub
 * starts pushing pixels every frame), cleared on `onLeave`/`onLeaveBack`
 * — leaving it on permanently is the well-known footgun (forces the
 * browser to keep the layer promoted/composited indefinitely), so this
 * only asks for it while the section is actually in its active range.
 */
function setWillChange(timeline: gsap.core.Timeline, value: string) {
  const tweens = timeline.getChildren(true, true, false) as gsap.core.Tween[];
  for (const tween of tweens) {
    for (const target of tween.targets<Element>()) {
      if (target instanceof HTMLElement) target.style.willChange = value;
    }
  }
}

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
            onEnter: () => setWillChange(timeline, "transform, opacity"),
            onEnterBack: () => setWillChange(timeline, "transform, opacity"),
            onLeave: () => setWillChange(timeline, "auto"),
            onLeaveBack: () => setWillChange(timeline, "auto"),
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
