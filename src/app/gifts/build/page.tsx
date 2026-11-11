import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GiftSetBuilder } from "@/components/gift-builder/GiftSetBuilder";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { GIFT_SETS, getGiftBuilderConfig, type GiftSetKey } from "@/lib/gift-builder/queries";
import { BASE_OPEN_GRAPH, DEFAULT_OG_IMAGE } from "@/lib/site";

/** Per-set search metadata. Each set is its own page as far as a crawler
 * is concerned (`?set=` picks the product), so each gets its own title,
 * description and canonical rather than all sharing the bars builder's. */
const SET_META: Record<GiftSetKey, { title: string; description: string; canonical: string }> = {
  bars: {
    title: "Build Your Own Chocolate Bar Gift Set",
    description:
      "Build your own Tom Foolery gift set: pick 3 or 6 chocolate bars, choose a band for the occasion, then add gift wrap and a note.",
    canonical: "/gifts/build",
  },
  caramels: {
    title: "Malört Caramel Gift Set",
    description:
      "A box of 4 or 8 Malört caramels from Tom Foolery, finished with a band for the occasion, optional gift wrap and a note.",
    canonical: "/gifts/build?set=caramels",
  },
};

const SET_LABELS: Record<GiftSetKey, string> = {
  bars: "Chocolate Bars",
  caramels: "Malört Caramels",
};

function resolveSet(raw: string | string[] | undefined): GiftSetKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && value in GIFT_SETS ? (value as GiftSetKey) : "bars";
}

export async function generateMetadata(props: PageProps<"/gifts/build">): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const { title, description, canonical } = SET_META[resolveSet(searchParams.set)];

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      ...BASE_OPEN_GRAPH,
      url: canonical,
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

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
