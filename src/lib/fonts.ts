import { Fraunces, Figtree } from "next/font/google";

/**
 * Brand typefaces — open-source stand-ins for the licensed Feature Deck
 * (display) and Sofia Pro (sans) faces named in the brand guide. These are
 * a deliberate substitution, not a placeholder: Fraunces is a variable
 * serif built for exactly this "premium but a little idiosyncratic"
 * display register (its `opsz` and `WONK` axes let large headlines lean
 * playful without tipping childish), and Figtree is a confident grotesque-
 * adjacent sans that covers both Black-weight preheaders and Regular body
 * copy the same way Sofia Pro's two weights did.
 *
 * Every consumer in the codebase reads the CSS variables below
 * (--font-display / --font-sans, exposed as the `font-display` / `font-sans`
 * Tailwind utilities) — nothing imports these exports by name. Swapping to
 * the licensed faces later is a one-file change: replace the two
 * declarations here with `next/font/local` pointed at the licensed WOFF2s
 * (see this file's git history for the shape that took before this swap).
 */

export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  // Variable font — `weight` is intentionally omitted so the full axis
  // stays available and components can dial in a specific weight via CSS
  // (headlines use 600; see typography.tsx). `opsz` responds automatically
  // to font-size via the browser's default `font-optical-sizing: auto`,
  // which is exactly what we want at hero scale — no extra CSS needed.
  // `WONK` has no automatic mapping, so it's applied selectively via
  // `font-variation-settings` where a touch of personality earns its keep
  // (Hero's headline only, not the shared Headline component everywhere).
  axes: ["opsz", "WONK"],
  fallback: ["Georgia", "serif"],
});

export const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "900"],
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
