"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { Preheader, Headline } from "@/components/ui/typography";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { formatMoney } from "@/lib/shopify/format";
import type { FeaturedProduct } from "@/lib/shopify/types";

/**
 * 3-card grid (stacked mobile, 3-col desktop), staggered fade-up as it
 * scrolls into view. Mirrors `ProductGridReveal`'s reveal recipe, which
 * already runs the Story spine's own cadence (power2/power3 `.out`
 * easing, ~0.6-0.7s durations, 0.08 stagger) — this section sits right
 * above the spine, so it should feel like the same hand animated both.
 * Split from `FeaturedProducts` so the data fetch stays server-side.
 */
export function FeaturedProductsReveal({ products }: { products: FeaturedProduct[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current) return;
      const cards = gridRef.current.querySelectorAll<HTMLElement>("[data-featured-card]");
      if (cards.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add(breakpoints.reducedMotion, () => {
        gsap.set([headerRef.current, ...Array.from(cards)], { opacity: 1, y: 0 });
      });

      mm.add(breakpoints.motionOK, () => {
        gsap.set(headerRef.current, { opacity: 0, y: 20 });
        gsap.set(cards, { opacity: 0, y: 32 });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        });
        tl.to(headerRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
        }).to(
          cards,
          { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 },
          "-=0.35"
        );

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [products.length] }
  );

  return (
    <section ref={sectionRef} className="px-fluid-md py-fluid-2xl">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-fluid-xl">
        <div ref={headerRef} className="flex flex-col items-center gap-fluid-sm text-center">
          <Preheader>Fan Favorites</Preheader>
          <Headline as="h2" size="md">
            Meet Your New Favorite Trouble
          </Headline>
        </div>

        <div ref={gridRef} className="grid w-full grid-cols-1 gap-fluid-lg md:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/shop/${product.handle}`}
              data-featured-card
              className="group block"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-tf-black/5">
                <Image
                  src={product.image.url}
                  alt={product.image.altText ?? product.title}
                  fill
                  sizes="(min-width: 768px) 30vw, 90vw"
                  className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.06] motion-safe:group-hover:-rotate-1"
                />
              </div>
              <h3 className="mt-fluid-sm font-display text-lg leading-tight text-fg sm:text-xl">
                {product.title}
              </h3>
              <p className="font-sans text-fg/70">{formatMoney(product.price)}</p>
            </Link>
          ))}
        </div>

        <Link href="/shop" className={buttonClasses("secondary")}>
          Shop All
        </Link>
      </div>
    </section>
  );
}
