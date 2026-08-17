"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { PinnedSection } from "@/components/motion/PinnedSection";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { TOKEN_VAR, TOKEN_CONTRAST } from "@/lib/theme";
import type { TfColorToken } from "@/lib/theme";

export type StorySectionLayout = "text-left" | "text-right" | "centered";

export interface StorySectionProps {
  /** Background token — --bg/--fg are set locally so nested `bg-bg`/`text-fg`
   * (and the ui kit, which reads currentColor) stay correctly contrasted. */
  bgColor: TfColorToken;
  preheader: string;
  /** A single string renders (and reveals) as one block. An array renders
   * one maskable line per entry, scrubbed in line-by-line. */
  headline: string | string[];
  body: string;
  /** A `next/image` or `BrandVideo` element, typically wrapped by the
   * caller in an aspect-ratio'd container (e.g. `aspect-[4/5]
   * overflow-hidden rounded-2xl`) — see `src/app/page.tsx` for the pattern.
   * BrandVideo slots in identically to an image: same wrapper convention,
   * same fade/scale reveal below, since the reveal animates this slot's
   * wrapping `<div>`, not anything image/video-specific inside it. */
  media?: ReactNode;
  layout?: StorySectionLayout;
  className?: string;
}

export function StorySection({
  bgColor,
  preheader,
  headline,
  body,
  media,
  layout = "text-left",
  className = "",
}: StorySectionProps) {
  const preheaderRef = useRef<HTMLParagraphElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const headlineLineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  const bgVar = `var(${TOKEN_VAR[bgColor]})`;
  const fgVar = `var(${TOKEN_VAR[TOKEN_CONTRAST[bgColor]]})`;

  const isCentered = layout === "centered";
  const isReversed = layout === "text-right";

  return (
    <PinnedSection
      className={`relative flex min-h-dvh w-full items-center bg-bg px-fluid-md py-fluid-2xl text-fg ${className}`}
      style={{ "--bg": bgVar, "--fg": fgVar } as React.CSSProperties}
      pinDistance="+=100%"
      scrub={true}
      onTimeline={(tl, { reducedMotion }) => {
        const lineTargets = headlineLineRefs.current.filter(
          (el): el is HTMLSpanElement => el !== null
        );
        const headlineTarget =
          lineTargets.length > 0 ? lineTargets : headlineRef.current;

        if (reducedMotion) {
          // Instant — final state only, no motion at all.
          tl.set([preheaderRef.current, bodyRef.current, mediaRef.current], {
            opacity: 1,
            y: 0,
            scale: 1,
          });
          tl.set(headlineTarget, { yPercent: 0, opacity: 1 });
          return;
        }

        tl.fromTo(
          preheaderRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
        )
          .fromTo(
            headlineTarget,
            { yPercent: 100, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.7,
              ease: "power3.out",
              stagger: 0.08,
            },
            "-=0.2"
          )
          .fromTo(
            bodyRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
            "-=0.35"
          )
          .fromTo(
            mediaRef.current,
            { opacity: 0, scale: 0.96 },
            { opacity: 1, scale: 1, duration: 0.7, ease: "power2.out" },
            "-=0.5"
          );
      }}
    >
      <div
        className={`mx-auto flex w-full max-w-6xl flex-col gap-fluid-lg ${
          isCentered
            ? "items-center text-center"
            : `md:flex-row md:items-center md:gap-fluid-2xl ${
                isReversed ? "md:flex-row-reverse" : ""
              }`
        }`}
      >
        <div
          className={`flex flex-col gap-fluid-md ${
            isCentered
              ? "items-center"
              : `md:flex-1 ${
                  isReversed
                    ? `md:items-end md:text-right${media ? "" : " md:ml-auto md:max-w-2xl"}`
                    : ""
                }`
          }`}
        >
          <Preheader ref={preheaderRef}>{preheader}</Preheader>
          <Headline ref={headlineRef} lineRefs={headlineLineRefs} size="md">
            {headline}
          </Headline>
          <BodyText ref={bodyRef} className="max-w-prose">
            {body}
          </BodyText>
        </div>

        {media && (
          <div ref={mediaRef} className={`w-full ${isCentered ? "" : "md:flex-1"}`}>
            {media}
          </div>
        )}
      </div>
    </PinnedSection>
  );
}
