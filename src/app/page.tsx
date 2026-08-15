import type { Metadata } from "next";
import Image from "next/image";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/ui/Marquee";
import { StorySection } from "@/components/sections/StorySection";
import { StripeDivider } from "@/components/ui/StripeDivider";
import { Footer } from "@/components/layout/Footer";

/** All three StorySection photos are below the Hero fold — none get
 * `priority`, all lazy-load by default. `sizes` matches each section's
 * actual rendered width: full-bleed on mobile, ~half the max-w-6xl
 * container (minus the gap) at md+. */
const STORY_IMAGE_SIZES = "(min-width: 768px) 40vw, 100vw";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main id="main-content">
      <Hero />

      <Marquee className="bg-tf-black py-fluid-sm" />

      <div id="story">
        <StorySection
          bgColor="juniper"
          preheader="Heritage"
          headline={["Rooted In", "Curiosity"]}
          body="Placeholder heritage copy: Tom Foolery started as a dare between friends who thought chocolate had gotten far too serious for its own good. What began as a kitchen experiment turned into a small, stubborn obsession with doing things differently."
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
        <StorySection
          bgColor="white"
          preheader="Philosophy"
          headline={["Playful,", "Never Precious"]}
          body="Placeholder philosophy copy: We believe the best things in life shouldn't take themselves too seriously — chocolate included. Every bar is built to make you smile first and think later."
          layout="text-right"
          media={
            <div className="aspect-[16/9] overflow-hidden rounded-2xl">
              <Image
                src="/photos/philosophy-live-a-little.jpg"
                alt="A woman laughing and holding up a chocolate bar"
                width={2033}
                height={1146}
                sizes={STORY_IMAGE_SIZES}
                className="h-full w-full object-cover"
              />
            </div>
          }
        />
        <StorySection
          bgColor="turmeric"
          preheader="Craft"
          headline={["Made With", "Odd Devotion"]}
          body="Placeholder craft copy: Every batch is small, a little strange, and stubbornly hand-finished. We chase interesting flavor pairings the way most people chase deadlines — constantly, and with way too much enthusiasm."
          layout="centered"
          media={
            <div className="mx-auto aspect-[4/5] max-w-md overflow-hidden rounded-2xl">
              <Image
                src="/photos/craft-hazelnut-bar-flatlay.jpg"
                alt="Overhead view of a hazelnut chocolate bar broken into pieces"
                width={1241}
                height={2200}
                sizes="(min-width: 448px) 448px, 100vw"
                className="h-full w-full object-cover"
              />
            </div>
          }
        />
      </div>

      <StripeDivider />

      <Footer />
    </main>
  );
}
