import type { Metadata } from "next";
import { GiftingHero } from "@/components/sections/GiftingHero";
import { GiftingPanels } from "@/components/sections/GiftingPanels";
import { GiftingStats } from "@/components/sections/GiftingStats";
import { GiftingForm } from "@/components/sections/GiftingForm";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { GIFT_SETS, getGiftBuilderConfig } from "@/lib/gift-builder/queries";
import { BASE_OPEN_GRAPH, DEFAULT_OG_IMAGE } from "@/lib/site";
import { HUBSPOT_GIFTING_FORM_URL } from "@/lib/gifting/hubspot";

const DESCRIPTION =
  "Clever & curious gifts for any occasion — custom & branded, wedding/event, and ready-to-ship chocolate gifting from Tom Foolery.";
const FORM_INTRO =
  "Tell us a bit about what you need and we'll follow up with options and pricing.";

const TITLE = "Chocolate Gifts: Custom, Branded & Event Gifting";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/gifting" },
  // Real content as of 2026-09-17 (was a robots:noindex placeholder
  // before) — indexable now, same as every other real page on the site.
  // images: DEFAULT_OG_IMAGE — see that constant's own comment on why an
  // openGraph override needs this explicitly, not just title/description.
  openGraph: {
    ...BASE_OPEN_GRAPH,
    url: "/gifting",
    title: TITLE,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

/**
 * Gifting landing page. Two paths out of the hero:
 *  - "Build a Gift Set" → /gifts/build (self-serve, ready to ship). Falls
 *    back to /collections/gifts while the builder product isn't live.
 *  - "Start a Custom Order" (and the Custom & Branded / Weddings & Events
 *    panels) → the HubSpot gifting form at NEXT_PUBLIC_HUBSPOT_GIFTING_FORM_URL.
 *
 * Until that env var is set, the custom CTAs scroll to the on-page
 * Resend-backed inquiry form below instead (useCustomGiftLink); once it's
 * set, that on-page form is dropped so there's only one place inquiries
 * land. `scroll-mt-24` keeps the anchor jump clear of the sticky nav.
 */
/** Whether /gifts/build has a live product behind it — never throws, so a
 * Shopify hiccup only hides the builder link rather than breaking /gifting. */
async function isGiftBuilderAvailable(): Promise<boolean> {
  try {
    return (await getGiftBuilderConfig(GIFT_SETS.bars)) !== null;
  } catch {
    return false;
  }
}

export default async function GiftingPage() {
  const giftBuilderAvailable = await isGiftBuilderAvailable();
  return (
    <main id="main-content">
      <GiftingHero variant="graphic" giftBuilderAvailable={giftBuilderAvailable} />
      <GiftingPanels giftBuilderAvailable={giftBuilderAvailable} />
      <GiftingStats />

      {!HUBSPOT_GIFTING_FORM_URL && (
        <section id="custom-gift" className="scroll-mt-24 px-fluid-md py-fluid-2xl">
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
      )}
    </main>
  );
}
