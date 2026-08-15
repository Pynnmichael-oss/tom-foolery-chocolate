/** Production URL — set NEXT_PUBLIC_SITE_URL once a real domain exists.
 * Falls back to localhost so dev/build never breaks without it. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_NAME = "Tom Foolery Chocolate";

/** Verbatim power statements — brand/BRAND_REFERENCE.md §1. */
export const POWER_STATEMENTS = {
  liveALittle: "Live a Little",
  chocolateInteresting: "Chocolate as Interesting as it is Irresistible.",
  funTastesBetter: "A Little Fun Always Tastes Better.",
  treatYourself: "Treat Yourself to Some Tom Foolery.",
} as const;
