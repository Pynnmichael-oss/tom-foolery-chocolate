import { getProducts } from "@/lib/shopify/queries";
import { ProductGridReveal } from "./ProductGridReveal";

/** Server Component — fetches the catalog, hands it to a client component
 * for the scroll-reveal animation and card interactivity. */
export async function ProductGrid() {
  const products = await getProducts();

  if (products.length === 0) {
    return (
      <p className="font-sans text-fg/70">
        No products available right now — check back soon.
      </p>
    );
  }

  return <ProductGridReveal products={products} />;
}
