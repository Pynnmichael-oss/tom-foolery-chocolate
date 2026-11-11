import type { MetadataRoute } from "next";
import { GIFT_SETS, getGiftBuilderConfig } from "@/lib/gift-builder/queries";
import { getCollectionSummaries, getProducts, getShopPolicies } from "@/lib/shopify/queries";
import { SITE_URL } from "@/lib/site";

/** `null` while the builder product is a Draft/unpublished, or Shopify
 * hiccups — /gifts/build 404s in that state, so it stays out. */
async function giftSetIsLive(handle: string): Promise<boolean> {
  try {
    return (await getGiftBuilderConfig(handle)) !== null;
  } catch {
    return false;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections, policies, barsLive, caramelsLive] = await Promise.all([
    getProducts(),
    getCollectionSummaries(),
    getShopPolicies(),
    giftSetIsLive(GIFT_SETS.bars),
    giftSetIsLive(GIFT_SETS.caramels),
  ]);

  // `lastModified` is only set where there's a real one (Shopify's
  // `updatedAt`). Stamping every URL with "now" on each regeneration tells
  // crawlers the field is meaningless, and they stop trusting it.
  const lastModified = (iso: string | undefined) => (iso ? { lastModified: new Date(iso) } : {});

  // Deliberately excludes /faq, /wholesale, /find-us — each is a
  // ComingSoonPage with `robots: { index: false }` (placeholder copy, no
  // reason to send crawlers there yet; see each route's own metadata).
  const policyPages: Array<{ path: string; exists: boolean }> = [
    { path: "/privacy", exists: Boolean(policies.privacyPolicy) },
    { path: "/returns", exists: Boolean(policies.refundPolicy) },
    { path: "/shipping", exists: Boolean(policies.shippingPolicy) },
    { path: "/terms", exists: Boolean(policies.termsOfService) },
  ];

  const giftBuilderPages = [
    { path: "/gifts/build", live: barsLive },
    { path: "/gifts/build?set=caramels", live: caramelsLive },
  ];

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/story`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/shop`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/gifting`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.5 },
    ...giftBuilderPages
      .filter((p) => p.live)
      .map((p) => ({
        url: `${SITE_URL}${p.path}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ...products.map((product) => ({
      url: `${SITE_URL}/shop/${product.handle}`,
      ...lastModified(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    // Admin-only collections are already filtered out by
    // getCollectionSummaries (see lib/shopify/collections.ts).
    ...collections.map((collection) => ({
      url: `${SITE_URL}/collections/${collection.handle}`,
      ...lastModified(collection.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    // Each policy route 404s on its own when the merchant hasn't filled
    // it in yet (see src/app/{privacy,returns,shipping,terms}/page.tsx) —
    // listing a 404 in the sitemap would be worse than just omitting it.
    ...policyPages
      .filter((p) => p.exists)
      .map((p) => ({
        url: `${SITE_URL}${p.path}`,
        changeFrequency: "yearly" as const,
        priority: 0.3,
      })),
  ];
}
