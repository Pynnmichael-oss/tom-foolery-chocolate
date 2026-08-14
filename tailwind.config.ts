import type { Config } from "tailwindcss";

/**
 * CSS-first tokens live in `src/app/globals.css` (`@theme` / `:root`).
 * This file just maps them onto Tailwind's theme so they're usable as
 * utility classes (bg-tf-turmeric, font-featureDeck, p-fluid-lg, ...).
 * Loaded via the `@config` directive at the top of globals.css.
 *
 * The fluid spacing scale is namespaced `fluid-*` (not bare `xs`/`sm`/...):
 * Tailwind's `maxWidth`/`borderRadius`/etc. scales already use those exact
 * T-shirt names, and extending `spacing` with same-named keys silently
 * clobbers them (e.g. `max-w-xl` would resolve to the spacing value instead
 * of its own 36rem default) rather than merging alongside.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "tf-black": "var(--tf-black)",
        "tf-white": "var(--tf-white)",
        "tf-turmeric": "var(--tf-turmeric)",
        "tf-juniper": "var(--tf-juniper)",
        "tf-cinnamon": "var(--tf-cinnamon)",
        "tf-rose": "var(--tf-rose)",
        bg: "var(--bg)",
        fg: "var(--fg)",
      },
      fontFamily: {
        featureDeck: ["var(--font-feature-deck)", "Georgia", "serif"],
        sofia: [
          "var(--font-sofia)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      spacing: {
        "fluid-xs": "var(--space-xs)",
        "fluid-sm": "var(--space-sm)",
        "fluid-md": "var(--space-md)",
        "fluid-lg": "var(--space-lg)",
        "fluid-xl": "var(--space-xl)",
        "fluid-2xl": "var(--space-2xl)",
        "fluid-3xl": "var(--space-3xl)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 32s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
