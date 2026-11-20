import type { Metadata } from "next";
import Link from "next/link";
import { WholesaleHero } from "@/components/sections/WholesaleHero";
import { WholesaleForm } from "@/components/sections/WholesaleForm";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import { WHOLESALE_FORM_ANCHOR } from "@/lib/wholesale/constants";

const DESCRIPTION =
  "Carry Tom Foolery — small-batch Chicago chocolate bars for gift shops, boutiques, cafés, bookstores, and specialty grocery. Order on Faire or send us a wholesale inquiry.";
// Social proof, not a perk: show a buyer who already stocks us. The
// store types and "coast to coast" are true of the current list
// (/find-us) — revisit if that list ever shrinks to one region.
const LOCATOR_PITCH =
  "Gift shops, markets, cafés and specialty grocers from coast to coast already have Tom Foolery on their shelves. Take a look at who you’d be joining.";
const FORM_INTRO =
  "Looking for something specific, have a question, or want help figuring out the best option for your business? Leave us a note and we'll get back to you.";

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
 * as /gifting) → store-locator band → inquiry form. Panels and a stats band like /gifting's are
 * planned once the content is ready.
 * The catalog CTAs go to Faire (lib/wholesale/constants.ts); the on-page
 * form (/api/wholesale) catches everything that doesn't fit Faire.
 */
export default function WholesalePage() {
  return (
    <main id="main-content">
      <WholesaleHero />

      {/* Who already carries us. Also the wholesale-side entry point to
          /find-us, which is kept out of the top nav on purpose (see
          FindAShopNote). */}
      <section className="bg-tf-turmeric/25 px-fluid-md py-fluid-xl">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-fluid-sm text-center">
          <Preheader>In Good Company</Preheader>
          <Headline as="h2" size="sm">
            See Who Carries Us
          </Headline>
          <BodyText className="max-w-md text-fg/80">{LOCATOR_PITCH}</BodyText>
          <Link href="/find-us" className={buttonClasses("secondary", "mt-fluid-xs")}>
            See the Stores
          </Link>
        </div>
      </section>

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
