"use client";

import { forwardRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { TOKEN_VAR, TOKEN_CONTRAST } from "@/lib/theme";
import type { TfColorToken } from "@/lib/theme";

export interface TextureBackgroundProps {
  /** Which brand swatch to render. The guide's own five texture swatches
   * (brand/BRAND_REFERENCE.md §5) are charcoal/juniper/rose/cinnamon/white
   * — turmeric is included here too since it's already an established
   * accent in this app's token system (see `BrandCompass`'s four tenets). */
  color: TfColorToken;
  /** Content rendered on top of the texture, at `relative z-10` — the
   * correctly-contrasting foreground color (`TOKEN_CONTRAST`) is set on
   * this component's own wrapper, so children just inherit `color`
   * normally, same pairing `StorySection`/`BrandCompass` already do via
   * `--bg`/`--fg`. Omit entirely to use this purely as a decorative fill
   * layer — position it with `className="absolute inset-0"` inside an
   * already-`relative` parent that renders its own content on top. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

// Inline SVG noise (feTurbulence → desaturate) as a data URI — no texture
// scan/image asset exists in the repo (the guide's own texture swatches
// were catalogued as a color reference, not extracted as usable files;
// see brand/BRAND_REFERENCE.md §5), so this fakes print-grain
// procedurally instead of waiting on one.
const NOISE_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>" +
  "<filter id='grain'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>" +
  "<feColorMatrix type='saturate' values='0'/></filter>" +
  "<rect width='100%' height='100%' filter='url(%23grain)'/></svg>";
const NOISE_URL = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`;

/**
 * The brand's signature "swaths of color with vintage-print/fabric-weave
 * texture" (brand guide Graphic Elements > Textures — brand/BRAND_REFERENCE.md
 * §5), as a reusable section background. Two layered decorative overlays,
 * both `mix-blend-mode: multiply` at low opacity so the swatch color
 * still reads clearly underneath: a fine SVG-noise grain (`NOISE_URL`
 * above) for the "vintage print" half, and a faint 45° hairline
 * repeat for the "fabric-weave" half.
 *
 * TODO(brand-assets): swap this procedural approximation for the guide's
 * real texture scans if/when they're extracted as standalone image
 * files — this component's public API (`color`) shouldn't need to
 * change, just what's layered inside it.
 */
export const TextureBackground = forwardRef<HTMLDivElement, TextureBackgroundProps>(
  function TextureBackground({ color, children, className = "", style }, ref) {
    const bgVar = `var(${TOKEN_VAR[color]})`;
    const fgVar = `var(${TOKEN_VAR[TOKEN_CONTRAST[color]]})`;

    return (
      <div
        ref={ref}
        className={`[contain:layout] ${className}`}
        style={{ backgroundColor: bgVar, color: fgVar, ...style }}
      >
        {/* `[contain:layout]` above makes the root a containing block for
         * absolutely-positioned descendants (CSS Containment spec) without
         * touching `position` at all — the root's own `position` stays
         * fully caller-controlled (a hardcoded `relative` here previously
         * collided with callers passing `absolute inset-0` for placement:
         * Tailwind v4 emits `.relative` after `.absolute` in the utilities
         * layer, so `relative` silently won that fight regardless of class
         * order).
         *
         * The overlay wrapper below anchors to that containing block via
         * `absolute inset-0`, not `height:100%` — verified empirically
         * (min-height-only parent: `height:100%` child resolves to 0px,
         * `position:absolute;inset:0` child fills correctly) because one
         * caller (`BrandCompass`'s reduced-motion fallback) sizes the root
         * with only `min-h-[...]`, no explicit `height`, and percentage
         * heights don't resolve against a min-height-only ancestor. */}
        <div className="absolute inset-0">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, var(--tf-black) 0, var(--tf-black) 1px, transparent 1px, transparent 7px)",
              opacity: 0.06,
              mixBlendMode: "multiply",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: NOISE_URL,
              backgroundSize: "180px 180px",
              opacity: 0.15,
              mixBlendMode: "multiply",
            }}
          />
        </div>
        {children && <div className="relative z-10">{children}</div>}
      </div>
    );
  }
);
