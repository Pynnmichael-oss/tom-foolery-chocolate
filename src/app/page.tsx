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
            <div className="aspect-[4/5] overflow-hidden rounded-2xl">
              <Image
                src="/photos/heritage-friends-sharing-chocolate.jpg"
                alt="Two friends laughing together over a piece of chocolate"
                width={1956}
                height={2200}
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
