import type { Metadata } from "next";
import { StoryHero } from "@/components/sections/StoryHero";
import { HeritageBeat } from "@/components/sections/HeritageBeat";
import { StoryClosingCta } from "@/components/sections/StoryClosingCta";
import { DEFAULT_OG_IMAGE } from "@/lib/site";

// Distinct from the homepage's description (POWER_STATEMENTS.chocolate-
// Interesting) — duplicate <meta name="description"> across pages is
// worth avoiding on its own, and this page's real content (as of the
// Sugar Bowl/Tom Meldrum copy) is specific enough to describe on its own
// terms rather than reusing the site-wide tagline.
const DESCRIPTION =
  "Three generations from Tom Meldrum's Sugar Bowl candy store to Tom Foolery today — the family history behind the chocolate.";

export const metadata: Metadata = {
  title: "Our Story",
  description: DESCRIPTION,
  alternates: { canonical: "/story" },
  // images: DEFAULT_OG_IMAGE — see that constant's own comment on why an
  // openGraph override needs this explicitly, not just title/description.
  openGraph: {
    title: "Our Story",
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

/**
 * TODO(brand-copy): placeholder, written in Tom's voice per
 * brand/BRAND_REFERENCE.md §1's voice rules (playful, a little
 * mischievous, puns allowed but "please pun responsibly") — swap for the
 * verbatim Brand Story copy block once it's pasted in. Keep the
 * one-line-per-beat shape if you can; `StoryHero` reveals one line at a
 * time as the reader scrolls, so a very different line count/rhythm may
 * need re-tuning there (see that file's own comment).
 */
const STORY_HERO_LINES = [
  "Chocolate got serious. Somebody had to ruin that.",
  "So we did — on purpose, with a straight face, and a very small amount of shame.",
  "Every bar starts as a dare and somehow ends up on a shelf, which honestly surprises us too.",
  "We chase flavors nobody asked for, because the ones everybody asked for got boring.",
  "This isn't dessert. It's a little bit of trouble you can eat.",
];

/**
 * Standalone Story page — Tom's monologue, the heritage photo beside
 * Garrett's note, and the closing "Shop the Collection" CTA.
 *
 * Content change requested by Garrett (owner): everything that used to sit
 * between the heritage block and the closing CTA (`StripeCurtainReveal`,
 * `LiveALittleStatement`, `BrandCompass`, `ClosingPhotoGrid`) was removed
 * from this page. Those components still exist in `components/sections/`;
 * `BrandCompass` is still used on the homepage.
 */
export default function StoryPage() {
  return (
    <main id="main-content">
      <StoryHero preheader="Tom's Take" lines={STORY_HERO_LINES} signOff="—Tom" />
      <HeritageBeat />
      <StoryClosingCta />
    </main>
  );
}
