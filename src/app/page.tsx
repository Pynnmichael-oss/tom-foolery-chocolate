import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/ui/Marquee";
import { StorySection } from "@/components/sections/StorySection";
import { StripeDivider } from "@/components/ui/StripeDivider";
import { Footer } from "@/components/layout/Footer";

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
        />
        <StorySection
          bgColor="white"
          preheader="Philosophy"
          headline={["Playful,", "Never Precious"]}
          body="Placeholder philosophy copy: We believe the best things in life shouldn't take themselves too seriously — chocolate included. Every bar is built to make you smile first and think later."
          layout="text-right"
        />
        <StorySection
          bgColor="turmeric"
          preheader="Craft"
          headline={["Made With", "Odd Devotion"]}
          body="Placeholder craft copy: Every batch is small, a little strange, and stubbornly hand-finished. We chase interesting flavor pairings the way most people chase deadlines — constantly, and with way too much enthusiasm."
          layout="centered"
        />
      </div>

      <StripeDivider />

      <Footer />
    </main>
  );
}
