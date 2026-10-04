import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/ui/Marquee";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { ScrollPrompt } from "@/components/sections/ScrollPrompt";
import { WhatWeBelieve } from "@/components/sections/WhatWeBelieve";
import { TomPeek } from "@/components/sections/TomPeek";

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
export default function Home() {
  return (
    <main id="main-content">
      <Hero backgroundVideo="hero-orbit-new" backgroundVideoPoster="/video/hero-orbit-new-poster.jpg" />

      <Marquee className="bg-tf-black py-fluid-sm" />

      <FeaturedProducts />

      <ScrollPrompt />

      <WhatWeBelieve />

      <div className="mx-auto flex max-w-6xl justify-end px-fluid-md">
        <TomPeek className="mb-fluid-md" />
      </div>
    </main>
  );
}
