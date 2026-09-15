import type { Metadata } from "next";
import Image from "next/image";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/ui/Marquee";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { ScrollPrompt } from "@/components/sections/ScrollPrompt";
import { StorySection } from "@/components/sections/StorySection";
import { WhatWeBelieve } from "@/components/sections/WhatWeBelieve";
import { BrandCompass } from "@/components/sections/BrandCompass";
import { TomPeek } from "@/components/sections/TomPeek";
import { StripeDivider } from "@/components/ui/StripeDivider";
import { Footer } from "@/components/layout/Footer";

/** The Heritage StorySection photo is below the Hero fold — no `priority`,
 * lazy-loads by default. `sizes` matches its actual rendered width:
 * full-bleed on mobile, ~half the max-w-6xl container (minus the gap) at
 * md+. (Philosophy and Craft, the other two former StorySection photo
 * slots, were replaced by WhatWeBelieve's card grid — see that component.) */
const STORY_IMAGE_SIZES = "(min-width: 768px) 40vw, 100vw";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main id="main-content">
      <Hero backgroundVideo="hero-orbit-new" backgroundVideoPoster="/video/hero-orbit-new-poster.jpg" />

      <Marquee className="bg-tf-black py-fluid-sm" />

      <FeaturedProducts />

      <ScrollPrompt />

      <div id="story">
        <StorySection
          bgColor="juniper"
          preheader="Heritage"
          headline={["Built on 3 Generations", "of Chocolate Legacy"]}
          body="Before there was Tom Foolery, there was Tom Meldrum, my grandfather and the proprietor of the Sugar Bowl in Massillon, Ohio. Over 60 years later we are still crafting chocolate by hand, using only real chocolate and the best ingredients for an experience guaranteed to bring a smile to your face. So grab a bar or a bon bon, take a bite, and live a little."
          layout="text-left"
          media={
            // Same real black-and-white heritage photo as `/story`'s
            // `HeritageBeat` (`heritage-founding-family.jpg`) — it already
            // ran under this exact "three generations" claim on the live
            // production homepage (see that component's own provenance
            // comment), so it belongs here more than the generic stock
            // "friends laughing" placeholder it replaces. Wrapper matches
            // this section's existing aspect-ratio/overflow-hidden/
            // rounded-2xl convention (same as every other StorySection
            // media slot); the ratio is set to the photo's own native
            // 847:703 rather than the previous 4:5 so nothing crops —
            // forcing a portrait crop here would risk cutting people out
            // of a real historical photo.
            <div className="aspect-[847/703] overflow-hidden rounded-2xl">
              <Image
                src="/photos/heritage-founding-family.jpg"
                alt="Black-and-white photo of five people holding a cake decorated with a floral wreath and the handwritten message “God Bless You, Bertha, Tommy and Mr. George,” in front of a football-themed mural"
                width={847}
                height={703}
                sizes={STORY_IMAGE_SIZES}
                className="h-full w-full object-cover"
              />
            </div>
          }
        />
        <WhatWeBelieve />

        {/* textured={false}: keep this instance's original flat-color
         * panels — the vintage-print texture wash + character marks were
         * built for /story; BrandCompass's own top-level comment has the
         * full story on why this flag exists. */}
        <BrandCompass textured={false} />
      </div>

      <StripeDivider />

      <div className="mx-auto flex max-w-6xl justify-end px-fluid-md">
        <TomPeek className="mb-fluid-md" />
      </div>

      <Footer />
    </main>
  );
}
