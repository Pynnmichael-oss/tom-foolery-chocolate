"use client";

import { useRef } from "react";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/shopify/types";

/** Staggered fade-up as the grid scrolls into view. Light ScrollTrigger,
 * no pin — plays once, statically visible (no animation) under reduced
 * motion. Split from ProductGrid so the data fetch stays server-side. */
export function ProductGridReveal({ products }: { products: Product[] }) {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current) return;
      const cards = gridRef.current.querySelectorAll<HTMLElement>("[data-product-card]");
      if (cards.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add(breakpoints.reducedMotion, () => {
        gsap.set(cards, { opacity: 1, y: 0 });
      });

      mm.add(breakpoints.motionOK, () => {
        gsap.set(cards, { opacity: 0, y: 32 });
        const tween = gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%",
          },
        });
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: gridRef, dependencies: [products.length] }
  );

  return (
    <div ref={gridRef} className="grid grid-cols-2 gap-fluid-md lg:grid-cols-3">
      {products.map((product) => (
        <div key={product.id} data-product-card>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
