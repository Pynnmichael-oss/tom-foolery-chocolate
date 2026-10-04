import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/shopify/types";

/**
 * Collection layout for exactly two products — two large cards, centered,
 * capped at ~960px rather than stretching edge to edge the way the 3+
 * grid (ProductGridReveal) does. Reuses the same ProductCard the shop
 * grid uses; just a different container around it.
 */
export function TwoProductShowcase({ products }: { products: [Product, Product] }) {
  return (
    <div className="mx-auto grid max-w-[960px] grid-cols-1 gap-fluid-xl sm:grid-cols-2">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
