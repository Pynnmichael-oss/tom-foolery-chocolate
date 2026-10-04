import type { MetadataRoute } from "next";
import { getCollectionHandles, getProducts } from "@/lib/shopify/queries";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collectionHandles] = await Promise.all([getProducts(), getCollectionHandles()]);
  const now = new Date();

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/story`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...products.map((product) => ({
      url: `${SITE_URL}/shop/${product.handle}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...collectionHandles.map((handle) => ({
      url: `${SITE_URL}/collections/${handle}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
