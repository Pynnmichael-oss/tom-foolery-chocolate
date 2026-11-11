import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GiftSetBuilder } from "@/components/gift-builder/GiftSetBuilder";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { GIFT_SETS, getGiftBuilderConfig, type GiftSetKey } from "@/lib/gift-builder/queries";
import { DEFAULT_OG_IMAGE } from "@/lib/site";

const DESCRIPTION =
  "Build your own Tom Foolery gift set — pick the bars, pick a band for the occasion, add gift wrap and a note.";

const SET_LABELS: Record<GiftSetKey, string> = {
  bars: "Chocolate Bars",
  caramels: "Malört Caramels",
};

function resolveSet(raw: string | string[] | undefined): GiftSetKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && value in GIFT_SETS ? (value as GiftSetKey) : "bars";
}

export const metadata: Metadata = {
  title: "Build a Gift Set",
  description: DESCRIPTION,
  // One canonical for both ?set= variants — same page, different product.
  alternates: { canonical: "/gifts/build" },
  openGraph: {
    title: "Build a Gift Set",
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

/**
 * /gifts/build?set=bars | caramels — build-your-own gift set. Each set is
 * a Shopify product whose builder config (bands, flavors, note length)
 * lives in `gift_builder.*` metafields; see lib/gift-builder/queries.ts.
 * 404s until the product is Active and published to the Headless channel.
 */
export default async function GiftBuilderPage(props: PageProps<"/gifts/build">) {
  const searchParams = await props.searchParams;
  const set = resolveSet(searchParams.set);
  const occasion = Array.isArray(searchParams.occasion) ? searchParams.occasion[0] : searchParams.occasion;
  const config = await getGiftBuilderConfig(GIFT_SETS[set]);
  if (!config) notFound();

  return (
    <main id="main-content" className="px-fluid-md py-fluid-xl">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-fluid-lg">
        <div className="flex flex-col items-center gap-fluid-sm text-center">
          <Preheader>Build a Gift Set</Preheader>
          <Headline as="h1" size="md">
            {config.title}
          </Headline>
          {config.description ? <BodyText className="max-w-xl text-fg/80">{config.description}</BodyText> : null}

          <nav aria-label="Gift set type" className="mt-fluid-xs flex flex-wrap justify-center gap-2">
            {(Object.keys(GIFT_SETS) as GiftSetKey[]).map((key) => (
              <Link
                key={key}
                href={`/gifts/build?set=${key}`}
                aria-current={key === set ? "page" : undefined}
                className="rounded-full border-2 border-tf-black/20 px-4 py-1.5 font-sans text-sm font-semibold transition-colors hover:border-tf-black aria-[current=page]:border-tf-black aria-[current=page]:bg-tf-black aria-[current=page]:text-tf-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon"
              >
                {SET_LABELS[key]}
              </Link>
            ))}
          </nav>
        </div>

        {/* key: remount on set switch so the builder's state (size, slots,
         * band) starts fresh for the new product. */}
        <GiftSetBuilder key={config.handle} config={config} initialOccasion={occasion} />
      </div>
    </main>
  );
}
