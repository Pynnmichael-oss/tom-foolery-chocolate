"use client";

import Image from "next/image";
import Link from "next/link";
import { Headline, BodyText } from "@/components/ui/typography";
import { AddToCartButton } from "./AddToCartButton";
import { PurchaseOptionsFields } from "./PurchaseOptionsFields";
import { priceRangeLabel } from "@/lib/shopify/format";
import { useProductPurchaseOptions } from "@/lib/hooks/useProductPurchaseOptions";
import type { Product } from "@/lib/shopify/types";

/**
 * Single-product collection layout (`/collections/[handle]` when there's
 * exactly one product) — a bigger, more deliberate presentation than a
 * grid card: large image, full purchase controls, and a working Add to
 * Cart right on the collection page, plus a link through to the full PDP.
 * Variant/selling-plan state and its selector UI are the same
 * `useProductPurchaseOptions`/`PurchaseOptionsFields` pair ProductDetail.tsx
 * uses — no separate cart-wiring here, `AddToCartButton` is the same one
 * component both call.
 */
export function FeaturedProductPanel({ product }: { product: Product }) {
  const options = useProductPurchaseOptions(product);
  const { selectedVariant, selectedSellingPlan, basePrice } = options;
  const image = product.images[0];

  return (
    <div className="grid gap-fluid-xl md:grid-cols-[55%_45%] md:items-center md:gap-fluid-2xl">
      {/* Image first in DOM order — mobile (grid-cols-1) stacks it above
       * the details for free, no order-* override needed. */}
      <div className="aspect-square overflow-hidden rounded-2xl bg-tf-black/5">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.title}
            width={image.width ?? 1200}
            height={image.height ?? 1200}
            className="h-full w-full object-contain"
            priority
            sizes="(min-width: 768px) 55vw, 100vw"
          />
        ) : (
          // /70 not /40 — WCAG AA (/40 measures 2.24:1, fails)
          <div className="flex h-full w-full items-center justify-center text-fg/70">
            No image available
          </div>
        )}
      </div>

      <div className="flex flex-col gap-fluid-md">
        <Headline as="h2" size="md">
          {product.title}
        </Headline>
        <p className="font-sans text-lg text-fg/80">{priceRangeLabel(product.priceRange)}</p>
        <BodyText className="text-fg/80">{product.description}</BodyText>

        <PurchaseOptionsFields
          options={options}
          requiresSellingPlan={product.requiresSellingPlan}
          basePrice={basePrice}
        />

        <div className="mt-fluid-xs flex flex-wrap items-center gap-fluid-md">
          <AddToCartButton
            product={product}
            variant={selectedVariant}
            sellingPlan={
              selectedSellingPlan ? { id: selectedSellingPlan.id, name: selectedSellingPlan.name } : undefined
            }
          />
          <Link
            href={`/shop/${product.handle}`}
            className="font-sans text-sm font-black uppercase tracking-[0.075em] text-fg underline decoration-2 underline-offset-4 transition-colors hover:text-tf-cinnamon-strong"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
