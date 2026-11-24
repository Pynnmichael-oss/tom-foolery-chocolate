import type { Metadata } from "next";
import { getProduct } from "@/lib/shopify/queries";
import type { Product } from "@/lib/shopify/types";
import { BASE_OPEN_GRAPH, DEFAULT_OG_IMAGE } from "@/lib/site";
import {
  MISCHIEF_SOCIETY_HANDLE,
  MISCHIEF_SOCIETY_PATH,
  TIERS,
  salePhase,
} from "@/lib/mischief-society/config";
import { SocietyRibbon } from "@/components/mischief-society/SocietyRibbon";
import {
  MembershipPicker,
  type PickerTier,
} from "@/components/mischief-society/MembershipPicker";
import {
  SocietyClosing,
  SocietyFaq,
  SocietyGifting,
  SocietyHero,
  SocietyPerks,
  SocietyTimeline,
  StripeBand,
} from "@/components/mischief-society/SocietySections";

const TITLE = "The Mischief Society: Chocolate of the Month Club";
const DESCRIPTION =
  "Six months of Tom Foolery chocolate, January through June. Members pick their bars every month, including member-only flavors. Gift it to as many people as you like. Sold through Cyber Monday, 11/30 only.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: MISCHIEF_SOCIETY_PATH },
  openGraph: {
    ...BASE_OPEN_GRAPH,
    url: MISCHIEF_SOCIETY_PATH,
    title: TITLE,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

// Re-render at least every 5 minutes so the sale phase in the HTML (and
// Shopify stock) stays close to real time around opening and closing.
// The ribbon and picker re-check the clock in the browser as well.
export const revalidate = 300;

/** Never throws: a Shopify hiccup (or the product still being a Draft)
 * shows the page with fallback prices and Add to Cart switched off. */
async function loadMembership(): Promise<Product | null> {
  try {
    return await getProduct(MISCHIEF_SOCIETY_HANDLE);
  } catch (error) {
    console.error("[mischief-society] product unavailable:", error);
    return null;
  }
}

function buildTiers(product: Product | null): PickerTier[] {
  return TIERS.map((tier) => {
    const variant =
      product?.variants.find(
        (v) =>
          v.title === tier.optionValue ||
          v.selectedOptions.some((o) => o.value === tier.optionValue)
      ) ?? null;
    return {
      bars: tier.bars,
      name: tier.name,
      compareMonthly: tier.compareMonthly,
      price: variant?.price ?? { amount: tier.fallbackPrice.toFixed(2), currencyCode: "USD" },
      variant,
    };
  });
}

/**
 * The Mischief Society membership page: buy one for yourself, or gift as
 * many as you like — each recipient gets an email from the buyer on the
 * date they pick (sent by /api/cron/mischief-society-gifts).
 */
export default async function MischiefSocietyPage() {
  const product = await loadMembership();
  const phase = salePhase();

  return (
    <main id="main-content">
      <SocietyRibbon initialPhase={phase} />
      <SocietyHero phase={phase} />
      <StripeBand />
      <SocietyPerks />
      <SocietyTimeline />
      <MembershipPicker
        tiers={buildTiers(product)}
        product={{
          title: product?.title ?? TITLE,
          handle: MISCHIEF_SOCIETY_HANDLE,
          images: product?.images ?? [],
        }}
        initialPhase={phase}
      />
      <SocietyGifting phase={phase} />
      <SocietyFaq />
      <SocietyClosing phase={phase} />
      <StripeBand />
    </main>
  );
}
