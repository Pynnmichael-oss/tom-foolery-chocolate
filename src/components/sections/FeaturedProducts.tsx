import { getFeaturedProducts } from "@/lib/shopify/queries";
import { FeaturedProductsReveal } from "./FeaturedProductsReveal";

/**
 * Server Component — fetches the "Featured" rail (mock data for now; see
 * the TODO above `getFeaturedProducts()` in `lib/shopify/queries.ts` for
 * the real Storefront collection query, already written and ready to
 * swap in as a single-function change) and hands off to a client
 * component for the scroll-triggered stagger reveal. Sits between Hero
 * and the Story spine on the homepage.
 */
export async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  if (products.length === 0) return null;

  return <FeaturedProductsReveal products={products} />;
}
