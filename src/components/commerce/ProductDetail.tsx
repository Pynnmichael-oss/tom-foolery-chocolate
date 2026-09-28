"use client";

import { useState } from "react";
import Image from "next/image";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { AddToCartButton } from "./AddToCartButton";
import { PurchaseOptionsFields } from "./PurchaseOptionsFields";
import { formatMoney } from "@/lib/shopify/format";
import { useProductPurchaseOptions } from "@/lib/hooks/useProductPurchaseOptions";
import type { Product } from "@/lib/shopify/types";

/** Client half of the PDP: gallery, variant selection, purchase-option
 * (one-time vs. selling plan) selection, and the sticky mobile add-to-cart
 * bar. The page itself (RSC) just fetches the product. Variant/selling-
 * plan selection state lives in useProductPurchaseOptions (shared with
 * FeaturedProductPanel.tsx's single-product collection layout); the
 * selector UI itself is PurchaseOptionsFields (same share). */
export function ProductDetail({ product }: { product: Product }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const options = useProductPurchaseOptions(product);
  const { selectedVariant, selectedSellingPlan, basePrice, price } = options;

  const activeImage = product.images[activeImageIndex];

  return (
    <main id="main-content" className="px-fluid-md py-fluid-xl">
      <div className="mx-auto grid max-w-6xl gap-fluid-xl md:grid-cols-2 md:gap-fluid-2xl">
        {/* Gallery */}
        <div className="flex flex-col gap-fluid-sm">
          <div className="aspect-square overflow-hidden rounded-2xl bg-tf-black/5">
            {activeImage ? (
              <Image
                src={activeImage.url}
                alt={activeImage.altText ?? product.title}
                width={activeImage.width ?? 1000}
                height={activeImage.height ?? 1000}
                className="h-full w-full object-contain"
                // Matches the gallery column's actual rendered width
                // (half the max-w-6xl grid at md+, full-bleed below it).
                // Without this, next/image has no `sizes` to size a
                // srcset against and falls back to ~1x/2x of the `width`
                // prop above — Shopify's real (large) image dimension —
                // requesting the full-resolution original even on mobile.
                sizes="(min-width: 768px) 50vw, 100vw"
                priority
              />
            ) : (
              // /70 not /40 — WCAG AA (/40 measures 2.24:1, fails)
              <div className="flex h-full w-full items-center justify-center text-fg/70">
                No image available
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-fluid-xs">
              {product.images.map((image, i) => (
                <button
                  key={image.url + i}
                  type="button"
                  onClick={() => setActiveImageIndex(i)}
                  aria-label={`View image ${i + 1} of ${product.images.length}`}
                  aria-current={i === activeImageIndex}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon ${
                    i === activeImageIndex
                      ? "opacity-100 ring-2 ring-tf-cinnamon"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={image.url} alt="" width={64} height={64} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-fluid-md pb-24 md:pb-0">
          <Preheader>Small Batch</Preheader>
          <Headline as="h1" size="md">
            {product.title}
          </Headline>
          <p className="font-sans text-lg text-fg/80">{formatMoney(price)}</p>
          <BodyText className="text-fg/80">{product.description}</BodyText>

          <PurchaseOptionsFields
            options={options}
            requiresSellingPlan={product.requiresSellingPlan}
            basePrice={basePrice}
          />

          <div className="hidden md:block">
            <AddToCartButton
              product={product}
              variant={selectedVariant}
              sellingPlan={selectedSellingPlan ? { id: selectedSellingPlan.id, name: selectedSellingPlan.name } : undefined}
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </div>

      {/* Sticky mobile add-to-cart bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-fluid-sm border-t border-tf-black/10 bg-bg px-fluid-md py-fluid-sm shadow-[0_-4px_16px_rgba(0,0,0,0.08)] md:hidden">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-display text-base leading-tight text-fg">
            {product.title}
          </span>
          <span className="font-sans text-sm text-fg/70">{formatMoney(price)}</span>
        </div>
        <AddToCartButton
          product={product}
          variant={selectedVariant}
          sellingPlan={selectedSellingPlan ? { id: selectedSellingPlan.id, name: selectedSellingPlan.name } : undefined}
          className="shrink-0"
        />
      </div>
    </main>
  );
}
