import localFont from "next/font/local";

/**
 * Brand typefaces, self-hosted via next/font/local.
 *
 * NOTE: the actual files in public/fonts/ are placeholders (OFL-licensed
 * stand-ins), not the licensed Feature Deck / Sofia Pro WOFF2s. Swap the
 * files once licensed — see public/fonts/README.md. No code changes needed
 * as long as the filenames stay the same.
 */

export const featureDeck = localFont({
  src: "../../public/fonts/FeatureDeck-Regular.woff2",
  variable: "--font-feature-deck",
  weight: "400",
  style: "normal",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const sofia = localFont({
  src: [
    {
      path: "../../public/fonts/SofiaPro-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/SofiaPro-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-sofia",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
