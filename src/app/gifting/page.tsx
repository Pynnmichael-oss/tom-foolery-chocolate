import type { Metadata } from "next";
import { GiftingHero } from "@/components/sections/GiftingHero";
import { GiftingPanels } from "@/components/sections/GiftingPanels";
import { GiftingStats } from "@/components/sections/GiftingStats";
import { GiftingForm } from "@/components/sections/GiftingForm";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";

const DESCRIPTION =
  "Clever & curious gifts for clients, guests, & more — custom & branded, wedding/event, and ready-to-ship chocolate gifting from Tom Foolery.";
const FORM_INTRO =
  "Tell us a bit about what you need and we'll follow up with options and pricing.";

export const metadata: Metadata = {
  title: "Corporate Gifting",
  description: DESCRIPTION,
  alternates: { canonical: "/gifting" },
  // Real content as of 2026-09-17 (was a robots:noindex placeholder
  // before) — indexable now, same as every other real page on the site.
  openGraph: {
    title: "Corporate Gifting",
    description: DESCRIPTION,
  },
};

/**
 * Corporate Gifting — replaces the `ComingSoonPage` placeholder that used
 * to live here (footer's "Corporate Gifting" link already pointed at
 * `/gifting`, so nothing there needed to change). Every CTA on the page
 * (hero button, each of the three panel buttons) points at the same
 * `#gifting-form` anchor via `href="#gifting-form"` — a real link, so it
 * still works with JS disabled or before hydration — plus an `onClick`
 * (`useScrollToGiftingForm`) that smooth-scrolls there and focuses the
 * form's first field, so keyboard/screen-reader users land ready to type,
 * not just visually at the section. `globals.css` still sets
 * `scroll-behavior: auto` (Lenis drives smooth scroll for wheel/touch
 * elsewhere; see that file's own comment) — the CTA's smooth scroll is
 * native `scrollIntoView`, independent of both. `scroll-mt-24` on the
 * target section keeps the jump from landing underneath the sticky nav.
 */
export default function GiftingPage() {
  return (
    <main id="main-content">
      <GiftingHero />
      <GiftingPanels />
      <GiftingStats />

      <section id="gifting-form" className="scroll-mt-24 px-fluid-md py-fluid-2xl">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-fluid-lg">
          <div className="flex flex-col items-center gap-fluid-sm text-center">
            <Preheader>Get Started</Preheader>
            <Headline as="h2" size="md">
              Let&rsquo;s Plan Your Gift
            </Headline>
            <BodyText className="max-w-md text-fg/80">{FORM_INTRO}</BodyText>
          </div>
          <GiftingForm />
        </div>
      </section>
    </main>
  );
}
