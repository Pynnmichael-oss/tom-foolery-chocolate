import { Newsreader, Poppins } from "next/font/google";

/**
 * Brand typefaces — open-source stand-ins for the licensed Feature Deck
 * (display) and Sofia Pro (sans) faces named in the brand guide. These are
 * a deliberate substitution, not a placeholder: Newsreader is a variable
 * editorial serif that's the closest free match to Feature Deck's display
 * style per the brand guide's typography spec page (its `opsz` axis lets
 * large headlines stay sharp while text sizes stay warm), and Poppins is
 * the widely-cited closest free match to Sofia Pro, covering both the
 * Black-weight preheaders (900, matching "Sofia Pro Black") and Regular
 * body copy (400) the same way Sofia Pro's two weights did.
 *
 * Every consumer in the codebase reads the CSS variables below
 * (--font-display / --font-sans, exposed as the `font-display` / `font-sans`
 * Tailwind utilities) — nothing imports these exports by name. Swapping to
 * the licensed faces later is a one-file change: replace the two
 * declarations here with `next/font/local` pointed at the licensed WOFF2s
 * (see this file's git history for the shape that took before this swap,
 * and for the Fraunces/Figtree interim swap that preceded this one).
 */

export const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  // Variable font — `weight` is intentionally omitted so the full axis
  // stays available and components can dial in a specific weight via CSS
  // (headlines use 600; see typography.tsx). `opsz` responds automatically
  // to font-size via the browser's default `font-optical-sizing: auto`,
  // which is exactly what we want at hero scale — no extra CSS needed.
  // Unlike Fraunces, Newsreader has no `WONK` axis — the hero's WONK
  // flourish was Fraunces-specific and has been dropped (see Hero.tsx).
  axes: ["opsz"],
  fallback: ["Georgia", "serif"],
});

export const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "900"],
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
