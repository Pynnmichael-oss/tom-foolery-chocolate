import type { Metadata } from "next";
import Link from "next/link";
import { Preheader, BodyText } from "@/components/ui/typography";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { TomMeldrumStory } from "@/components/sections/TomMeldrumStory";
import { StoryClosingCta } from "@/components/sections/StoryClosingCta";
import { BASE_OPEN_GRAPH, DEFAULT_OG_IMAGE } from "@/lib/site";

// Distinct from the homepage's description (POWER_STATEMENTS.chocolate-
// Interesting) — duplicate <meta name="description"> across pages is
// worth avoiding on its own, and this page's real content (Garrett's
// Tom Meldrum/Sugar Bowl letter) is specific enough to describe on its own
// terms rather than reusing the site-wide tagline.
const TITLE = "Our Story: Tom Meldrum's Sugar Bowl";
const DESCRIPTION =
  "Three generations from Tom Meldrum's Sugar Bowl candy store to Tom Foolery today — the family history behind the chocolate.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/story" },
  // images: DEFAULT_OG_IMAGE — see that constant's own comment on why an
  // openGraph override needs this explicitly, not just title/description.
  openGraph: {
    ...BASE_OPEN_GRAPH,
    url: "/story",
    title: TITLE,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

/**
 * Standalone Story page — the Tom Meldrum/Sugar Bowl redesign of Garrett's
 * (owner) letter as a scroll-driven story (`TomMeldrumStory`), then the
 * closing "Shop the Collection" CTA.
 *
 * The turmeric `StoryHero` monologue and the old `HeritageBeat` block it
 * used to sit beside were both replaced by `TomMeldrumStory` — neither
 * component is deleted (same convention as this file's git history:
 * replaced sections stay in `components/sections/`, just unused), but
 * `HeritageBeat` is now unused anywhere and `StoryHero`'s placeholder
 * monologue copy was never real brand copy to begin with.
 */
export default function StoryPage() {
  return (
    <main id="main-content">
      <TomMeldrumStory />
      <StoryClosingCta />
      {/* For writers researching the brand. Kept small so it doesn't
          compete with the shop CTA above. */}
      <section className="px-fluid-md py-fluid-xl">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-fluid-xs text-center">
          <Preheader>For Press</Preheader>
          <BodyText className="text-fg/80">
            Writing about Tom Foolery? Our press kit has fast facts, photos and logos.
          </BodyText>
          <Link href="/press" className={buttonClasses("secondary", "mt-fluid-xs")}>
            Visit the Press Kit
          </Link>
        </div>
      </section>
    </main>
  );
}
