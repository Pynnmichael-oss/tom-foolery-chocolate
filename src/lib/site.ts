/** Production URL — set NEXT_PUBLIC_SITE_URL once a real domain exists.
 * Falls back to localhost so dev/build never breaks without it. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_NAME = "Tom Foolery Chocolate";

/**
 * The site-wide OG/Twitter image (`app/opengraph-image.tsx`). Next
 * auto-attaches that file's image to a route's `openGraph.images` by
 * convention — but only when that route doesn't set its own `openGraph`
 * metadata at all; a route that sets `openGraph` (even just to override
 * `title`/`description`) fully replaces the inherited object rather than
 * merging into it, silently losing the image. Any page-level `openGraph`
 * override needs to re-list this explicitly (see /shop, /story, /gifting)
 * — Next resolves the relative path against `metadataBase`.
 */
export const DEFAULT_OG_IMAGE = "/opengraph-image";

/** Verbatim power statements — brand/BRAND_REFERENCE.md §1. */
export const POWER_STATEMENTS = {
  liveALittle: "Live a Little",
  chocolateInteresting: "Chocolate as Interesting as it is Irresistible.",
  funTastesBetter: "A Little Fun Always Tastes Better.",
  treatYourself: "Treat Yourself to Some Tom Foolery.",
} as const;
