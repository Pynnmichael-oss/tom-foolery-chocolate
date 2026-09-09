"use client";

import { forwardRef } from "react";
import type { SVGProps } from "react";

/**
 * Placeholder "OO" eyes + triangular hat silhouette — stands in for a
 * real Tom character illustration wherever one isn't finalized yet. See
 * brand/BRAND_REFERENCE.md §5's "Characters/Illustrations": "the many
 * secret and sneaky identities of Tom" — every character shares just
 * these two elements (Tom's eyes, Tom's hat) regardless of disguise, so
 * this reduced shape is a reasonable stand-in for any of them.
 *
 * Extracted from `TomPeek`'s original hand-drawn `PeekIcon` (same shape,
 * same viewBox) so every placeholder-character call site in the app —
 * `TomPeek`, `StripeCurtainReveal`, `BrandCompass`'s tenet panels — reads
 * as one consistent mark instead of three slightly different ones.
 * `fill="currentColor"` single-shape contract, same as `logos.tsx`'s real
 * marks — size via `className`/`width`/`height`, tint via text color.
 *
 * TODO(brand-assets): swap for real character illustrations once pulled
 * from the Illustrations asset folder (brand/BRAND_REFERENCE.md §5,
 * Gap 6) — every call site should be close to a drop-in swap given the
 * shared contract above.
 */
export const CharacterMark = forwardRef<
  SVGSVGElement,
  SVGProps<SVGSVGElement> & { className?: string }
>(function CharacterMark({ className = "", ...rest }, ref) {
  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox="0 0 16 28"
      fill="none"
      className={className}
      {...rest}
    >
      <path d="M2 12 L8 2 L14 12 Z" fill="currentColor" />
      <circle cx="5.5" cy="19" r="2.5" fill="currentColor" />
      <circle cx="10.5" cy="19" r="2.5" fill="currentColor" />
    </svg>
  );
});
