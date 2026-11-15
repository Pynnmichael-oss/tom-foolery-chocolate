import type { Metadata } from "next";
import { WholesaleHero } from "@/components/sections/WholesaleHero";
import { WholesaleForm } from "@/components/sections/WholesaleForm";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import { WHOLESALE_FORM_ANCHOR } from "@/lib/wholesale/constants";

const DESCRIPTION =
  "Carry Tom Foolery — small-batch Chicago chocolate bars for gift shops, boutiques, cafés, bookstores, and specialty grocery. Order on Faire or send us a wholesale inquiry.";
const FORM_INTRO =
  "Not ordering through Faire? Distributors, hospitality, corporate, and volume buyers — tell us about your business and we'll follow up with pricing and availability.";

export const metadata: Metadata = {
  title: "Wholesale",
  description: DESCRIPTION,
  alternates: { canonical: "/wholesale" },
  openGraph: {
    title: "Wholesale",
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

/**
 * Wholesale landing page for specialty retail buyers — graphic hero (same
 * as /gifting) → inquiry form. Panels and a stats band like /gifting's are
 * planned once the content is ready.
 * The catalog CTAs go to Faire (lib/wholesale/constants.ts); the on-page
 * form (/api/wholesale) catches everything that doesn't fit Faire.
 */
export default function WholesalePage() {
  return (
    <main id="main-content">
      <WholesaleHero />

      <section id={WHOLESALE_FORM_ANCHOR} className="scroll-mt-24 px-fluid-md py-fluid-2xl">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-fluid-lg">
          <div className="flex flex-col items-center gap-fluid-sm text-center">
            <Preheader>Wholesale Inquiries</Preheader>
            <Headline as="h2" size="md">
              Let&rsquo;s Get You Stocked
            </Headline>
            <BodyText className="max-w-md text-fg/80">{FORM_INTRO}</BodyText>
          </div>
          <WholesaleForm />
        </div>
      </section>
    </main>
  );
}
