import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/ui/Marquee";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { ScrollPrompt } from "@/components/sections/ScrollPrompt";
import { WhatWeBelieve } from "@/components/sections/WhatWeBelieve";
import { TomPeek } from "@/components/sections/TomPeek";
import { GiftBuilderFeature } from "@/components/sections/GiftBuilderFeature";
import { GIFT_SETS, getGiftBuilderConfig, type GiftBuilderConfig } from "@/lib/gift-builder/queries";

/** Never throws — a Shopify hiccup just hides the gift builder section
 * and hero button rather than breaking the homepage. `null` while the
 * product is still a Draft / unpublished. */
async function safeGiftConfig(handle: string): Promise<GiftBuilderConfig | null> {
  try {
    return await getGiftBuilderConfig(handle);
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Heritage (`StorySection`, preheader "Heritage" — the three-generations/
 * Sugar Bowl photo beat) and the four-tenet `BrandCompass` crossfade
 * carousel were removed from this page per the pre-launch content pass —
 * the page now goes straight from the Story spine's scroll-reveal
 * (`ScrollPrompt`) into `WhatWeBelieve`, which is the last section before
 * the footer. Neither component was deleted (`BrandCompass` still exists
 * in `components/sections/`, just unused anywhere now that this was its
 * only caller; `StorySection` likewise, though it's still imported by
 * nothing — `/story`'s own heritage beat is the unrelated `HeritageBeat`
 * component). The `StripeDivider` that used to separate the Story spine
 * from `TomPeek` was dropped too — it had nothing left to divide once
 * both of the sections above it were gone.
 */
export default async function Home() {
  const [bars, caramels] = await Promise.all([
    safeGiftConfig(GIFT_SETS.bars),
    safeGiftConfig(GIFT_SETS.caramels),
  ]);
  const heroCta = bars?.heroCta
    ? {
        label: bars.heroCta.label,
        href: `/gifts/build?set=bars${
          bars.heroCta.occasion ? `&occasion=${encodeURIComponent(bars.heroCta.occasion)}` : ""
        }`,
      }
    : undefined;

  return (
    <main id="main-content">
      <Hero backgroundVideo="hero-orbit-new" backgroundVideoPoster="/video/hero-orbit-new-poster.jpg"
        cta={heroCta}
      />

      <Marquee className="bg-tf-black py-fluid-sm" />

      {bars ? <GiftBuilderFeature bars={bars} caramels={caramels} /> : null}

      <FeaturedProducts />

      <ScrollPrompt />

      <WhatWeBelieve />

      <div className="mx-auto flex max-w-6xl justify-end px-fluid-md">
        <TomPeek className="mb-fluid-md" />
      </div>
    </main>
  );
}
