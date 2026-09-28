import type { MetadataRoute } from "next";
import { getProducts, getShopPolicies } from "@/lib/shopify/queries";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, policies] = await Promise.all([getProducts(), getShopPolicies()]);
  const now = new Date();

  // Deliberately excludes /faq, /wholesale, /find-us — each is a
  // ComingSoonPage with `robots: { index: false }` (placeholder copy, no
  // reason to send crawlers there yet; see each route's own metadata).
  const policyPages: Array<{ path: string; exists: boolean }> = [
    { path: "/privacy", exists: Boolean(policies.privacyPolicy) },
    { path: "/returns", exists: Boolean(policies.refundPolicy) },
    { path: "/shipping", exists: Boolean(policies.shippingPolicy) },
    { path: "/terms", exists: Boolean(policies.termsOfService) },
  ];

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/story`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/gifting`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    ...products.map((product) => ({
      url: `${SITE_URL}/shop/${product.handle}`,
      lastModified: now,
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
        lastModified: now,
        changeFrequency: "yearly" as const,
        priority: 0.3,
      })),
  ];
}
