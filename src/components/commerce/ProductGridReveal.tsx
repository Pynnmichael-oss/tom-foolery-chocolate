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
        // `fromTo`, not `set` + `to`: the hidden starting state below
        // mirrors the pre-paint CSS in globals.css
        // (`html.js [data-product-card]`), already in place before first
        // paint. A runtime `gsap.set(..., {opacity:0})` here would instead
        // hide cards the server already painted visible — a flash for
        // whichever row is already in view at load (this grid starts
        // right below a short header, so usually the first row).
        const tween = gsap.fromTo(
          cards,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 85%",
            },
          }
        );
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
      {products.map((product, i) => (
        <div key={product.id} data-product-card>
          {/* First 3 = the first row at this grid's widest column count
           * (lg:grid-cols-3), so this covers the first row at every
           * breakpoint (2 or 3 cols) — the likely LCP candidate for this
           * page. */}
          <ProductCard product={product} priority={i < 3} />
        </div>
      ))}
    </div>
  );
}
