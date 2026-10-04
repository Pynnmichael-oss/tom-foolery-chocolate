"use client";

import { useRef } from "react";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { FeaturedProductPanel } from "./FeaturedProductPanel";
import { TwoProductShowcase } from "./TwoProductShowcase";
import { ProductGridReveal } from "./ProductGridReveal";
import { CollectionEmptyState } from "./CollectionEmptyState";
import type { Product } from "@/lib/shopify/types";

/**
 * Picks the collection layout by product count:
 *  - 0: friendly empty state
 *  - 1: FeaturedProductPanel (big image + full purchase controls)
 *  - 2: TwoProductShowcase (two large centered cards)
 *  - 3+: the existing shop grid (ProductGridReveal), which already has
 *    its own scroll-reveal — not re-wrapped here.
 *
 * The 1-/2-product layouts rise in on scroll via the same html.js
 * pre-paint pattern the header band uses (globals.css
 * `[data-collection-reveal="products"]`) — reduced-motion/no-JS visitors
 * see the final state immediately.
 */
export function CollectionProductSection({ products }: { products: Product[] }) {
  const revealRef = useRef<HTMLDivElement>(null);
  const hasOwnReveal = products.length === 1 || products.length === 2;

  useGSAP(
    () => {
      if (!hasOwnReveal) return;
      const el = revealRef.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add(breakpoints.motionOK, () => {
        const tween = gsap.fromTo(
          el,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          }
        );
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      return () => mm.revert();
    },
    { dependencies: [hasOwnReveal] }
  );

  if (products.length === 0) return <CollectionEmptyState />;

  if (products.length === 1) {
    return (
      <div ref={revealRef} data-collection-reveal="products">
        <FeaturedProductPanel product={products[0]} />
      </div>
    );
  }

  if (products.length === 2) {
    return (
      <div ref={revealRef} data-collection-reveal="products">
        <TwoProductShowcase products={[products[0], products[1]]} />
      </div>
    );
  }

  return <ProductGridReveal products={products} />;
}
