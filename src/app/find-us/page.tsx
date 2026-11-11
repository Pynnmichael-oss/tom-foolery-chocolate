import type { Metadata } from "next";
import Link from "next/link";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { StoreLocator } from "@/components/stockists/StoreLocator";
import { getStockists } from "@/lib/stockists";

const BODY =
  "Pop in your ZIP code to find the nearest shop with Tom Foolery on its shelves. Every one has restocked in the last few months.";

export const metadata: Metadata = {
  title: "Where to Find Us",
  description:
    "Find a shop near you that carries Tom Foolery Chocolate — search by ZIP code or browse the map.",
  alternates: { canonical: "/find-us" },
};

// How often the stockist list is re-pulled from HubSpot (ISR). Has to be
// a literal here — Next reads route segment config statically — so keep
// it equal to STOCKIST_REVALIDATE_SECONDS in src/lib/stockists/hubspot.ts.
export const revalidate = 21600;

/**
 * Store locator. The page itself is a static shell + one data read
 * (`getStockists()`: live from HubSpot when configured, otherwise the
 * committed snapshot — see src/lib/stockists/index.ts for the rules on
 * who's listed); `StoreLocator` is the interactive part. Plain MAIN
 * treatment and no GSAP, like the other footer utility pages — the map
 * is the motion here.
 */
export default async function FindUsPage() {
  const stockists = await getStockists();

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-fluid-md px-fluid-md py-fluid-lg"
    >
      <div className="flex flex-col items-center gap-fluid-xs text-center">
        <Preheader>Where&rsquo;s Tom?</Preheader>
        <Headline as="h1" size="sm">
          Find Us Near You
        </Headline>
        <BodyText className="max-w-xl text-fg/80">{BODY}</BodyText>
      </div>

      <StoreLocator stockists={stockists} />

      <div className="flex flex-col items-center gap-fluid-sm border-t border-tf-black/15 pt-fluid-lg mt-fluid-md text-center">
        <BodyText className="max-w-md text-fg/80">
          Nothing close by? We ship everywhere in the U.S. &mdash; and if your favorite shop
          should be on this map, tell them (or tell us).
        </BodyText>
        <div className="flex flex-wrap justify-center gap-fluid-sm">
          <Link href="/shop" className={buttonClasses("primary")}>
            Shop Online
          </Link>
          <Link href="/contact" className={buttonClasses("secondary")}>
            Suggest a Shop
          </Link>
        </div>
      </div>
    </main>
  );
}
