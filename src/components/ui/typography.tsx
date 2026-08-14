"use client";

import { forwardRef } from "react";
import type { MutableRefObject, ReactNode } from "react";

/**
 * Hierarchy is enforced structurally, not by convention: Preheader's size
 * scale tops out at 1rem and Headline's bottoms out at 1.75rem. Because each
 * component keeps its own private size map, there is no prop combination
 * where a Preheader can render larger than a Headline next to it.
 */

/* ------------------------------------------------------------------ */
/* Preheader — Sofia Pro Black, uppercase, wide tracking               */
/* ------------------------------------------------------------------ */

export type PreheaderSize = "sm" | "md";

const PREHEADER_SIZE: Record<PreheaderSize, string> = {
  sm: "clamp(0.7rem, 0.65rem + 0.25vw, 0.85rem)",
  md: "var(--fs-preheader)", // clamp(0.75rem, ..., 1rem)
};

export interface PreheaderProps {
  children: ReactNode;
  size?: PreheaderSize;
  className?: string;
}

export const Preheader = forwardRef<HTMLParagraphElement, PreheaderProps>(
  function Preheader({ children, size = "md", className = "" }, ref) {
    return (
      <p
        ref={ref}
        className={`font-sofia font-black uppercase tracking-[0.075em] ${className}`}
        // Brand guide: line height = type size + 3pt (≈4px @ 1pt=1.3333px).
        // calc(1em + Npx) reproduces that additive rule exactly at any size.
        style={{ fontSize: PREHEADER_SIZE[size], lineHeight: "calc(1em + 4px)" }}
      >
        {children}
      </p>
    );
  }
);

/* ------------------------------------------------------------------ */
/* Headline — Feature Deck, fluid clamp sizes, title case               */
/* ------------------------------------------------------------------ */

export type HeadlineSize = "sm" | "md" | "lg" | "xl";

// Smallest tier (sm, min 1.75rem) still clears Preheader's largest tier
// (md, max 1rem) at every viewport width.
const HEADLINE_SIZE: Record<HeadlineSize, string> = {
  sm: "clamp(1.75rem, 1.3rem + 2.25vw, 3rem)",
  md: "clamp(2.25rem, 1.5rem + 3.5vw, 4.5rem)",
  lg: "var(--fs-header)", // clamp(2.5rem, ..., 7rem) — hero scale
  xl: "clamp(3rem, 1.6rem + 6.5vw, 9rem)",
};

export interface HeadlineProps {
  /** Author copy in Title Case — plain text renders as-is (no automatic
   * `text-transform`, which mis-cases articles/prepositions). Pass an array
   * instead to get one wrapped, maskable line per entry for a scroll-scrubbed
   * split-text reveal. */
  children: string | string[];
  as?: "h1" | "h2" | "h3";
  size?: HeadlineSize;
  className?: string;
  /** Populated with each line's inner span (only when `children` is an
   * array) — hand these to a GSAP timeline for the reveal. */
  lineRefs?: MutableRefObject<Array<HTMLSpanElement | null>>;
}

export const Headline = forwardRef<HTMLHeadingElement, HeadlineProps>(
  function Headline(
    { children, as: Tag = "h2", size = "lg", className = "", lineRefs },
    ref
  ) {
    const lines = Array.isArray(children) ? children : null;

    if (lineRefs) lineRefs.current = [];

    return (
      <Tag
        ref={ref}
        className={`font-featureDeck ${className}`}
        // Brand guide: line height = type size + 12pt (≈16px). Always
        // looser than 1:1 — do not tighten this below 1em for display type.
        style={{ fontSize: HEADLINE_SIZE[size], lineHeight: "calc(1em + 16px)" }}
      >
        {lines
          ? lines.map((line, i) => (
              <span key={i} className="block overflow-hidden">
                <span
                  ref={(el) => {
                    if (lineRefs) lineRefs.current[i] = el;
                  }}
                  className="block"
                >
                  {line}
                </span>
              </span>
            ))
          : children}
      </Tag>
    );
  }
);

/* ------------------------------------------------------------------ */
/* BodyText — Sofia Pro Regular                                         */
/* ------------------------------------------------------------------ */

export type BodyTextSize = "sm" | "md" | "lg";

const BODY_SIZE: Record<BodyTextSize, string> = {
  sm: "clamp(0.875rem, 0.83rem + 0.2vw, 1rem)",
  md: "var(--fs-body)",
  lg: "clamp(1.125rem, 1rem + 0.55vw, 1.5rem)",
};

export interface BodyTextProps {
  children: ReactNode;
  size?: BodyTextSize;
  className?: string;
}

export const BodyText = forwardRef<HTMLParagraphElement, BodyTextProps>(
  function BodyText({ children, size = "md", className = "" }, ref) {
    return (
      <p
        ref={ref}
        className={`font-sofia font-normal ${className}`}
        // Brand guide: line height = type size + 8pt (≈10.67px).
        style={{ fontSize: BODY_SIZE[size], lineHeight: "calc(1em + 10.67px)" }}
      >
        {children}
      </p>
    );
  }
);
