import { forwardRef } from "react";
import Image from "next/image";

/**
 * Real brand logo assets, pulled from the brand guide (see
 * brand/BRAND_REFERENCE.md §4) rather than hand-drawn — for now, pending
 * the actual vector files from the brand asset folder the guide links to.
 * Every variant/tone the guide defines that we don't have artwork for yet
 * is simply absent from LOGOS below; `Logo` throws a clear error if asked
 * for one, rather than silently rendering nothing.
 */

export type LogoVariant = "horizontal-signature" | "stacked-signature" | "icon";
export type LogoTone = "positive" | "negative";

interface LogoDef {
  src: string;
  /** Intrinsic asset size, for aspect-ratio math. */
  width: number;
  height: number;
  /** Brand guide's stated minimum for this variant. */
  min: { px: number; dimension: "width" | "height" };
}

const LOGOS: Partial<Record<`${LogoVariant}:${LogoTone}`, LogoDef>> = {
  "horizontal-signature:positive": {
    src: "/logos/horizontal-signature-positive.png",
    width: 2393,
    height: 755,
    min: { px: 144, dimension: "width" }, // guide: 2" / 144px wide
  },
  "stacked-signature:negative": {
    src: "/logos/stacked-signature-negative.png",
    width: 1719,
    height: 1279,
    min: { px: 108, dimension: "height" }, // guide: 1.5" / 108px TALL (not wide)
  },
  "icon:positive": {
    src: "/logos/icon-positive.png",
    width: 650,
    height: 781,
    min: { px: 27, dimension: "width" }, // guide: .375" / 27px wide
  },
  "icon:negative": {
    src: "/logos/icon-negative.png",
    width: 650,
    height: 781,
    min: { px: 27, dimension: "width" },
  },
};

export interface LogoProps {
  variant: LogoVariant;
  /** positive = dark ink, for light backgrounds. negative = light ink, for dark backgrounds. */
  tone: LogoTone;
  /** Rendered width in px (the layout/intrinsic size — actual display size
   * can still be overridden via `className`, same as any next/image). */
  width: number;
  /** Defaults to preserving the asset's real aspect ratio. */
  height?: number;
  /** Which dimension is authoritative — the other gets an explicit inline
   * `auto` so it tracks the asset's real aspect ratio and next/image's
   * dev-mode size check stays happy (the project's global img reset already
   * sets height:auto; this just makes that intentional per-instance). For
   * `sizeBy="height"`, drive the fixed height via `className` (e.g. `h-16
   * sm:h-20`) since inline style can't do media queries. */
  sizeBy?: "width" | "height";
  className?: string;
  priority?: boolean;
  alt?: string;
}

/** Renders a real brand logo asset. In development, warns (doesn't block)
 * if the rendered size falls below the brand guide's stated minimum for
 * that variant — see brand/BRAND_REFERENCE.md §4 "Minimum sizes". */
export const Logo = forwardRef<HTMLImageElement, LogoProps>(function Logo(
  { variant, tone, width, height, sizeBy = "width", className, priority, alt = "Tom Foolery" },
  ref
) {
  const key = `${variant}:${tone}` as const;
  const def = LOGOS[key];

  if (!def) {
    throw new Error(
      `Logo: no asset for "${variant}" (${tone}) yet. Available: ${Object.keys(LOGOS).join(", ")}. See brand/BRAND_REFERENCE.md Gap 6.`
    );
  }

  const renderedHeight = height ?? Math.round((width / def.width) * def.height);
  const renderedDimension = def.min.dimension === "width" ? width : renderedHeight;
  const autoStyle = sizeBy === "width" ? { height: "auto" as const } : { width: "auto" as const };

  if (process.env.NODE_ENV !== "production" && renderedDimension < def.min.px) {
    console.warn(
      `[Logo] ${variant} (${tone}) rendered at ${renderedDimension}px ${def.min.dimension}, ` +
        `below the brand guide's ${def.min.px}px minimum for this variant.`
    );
  }

  return (
    <Image
      ref={ref}
      src={def.src}
      alt={alt}
      width={width}
      height={renderedHeight}
      priority={priority}
      className={className}
      style={autoStyle}
    />
  );
});
