"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { AddToCartButton } from "./AddToCartButton";
import { formatMoney } from "@/lib/shopify/format";
import type { Product, ProductVariant } from "@/lib/shopify/types";

/** Client half of the PDP: gallery, variant selection, and the sticky
 * mobile add-to-cart bar. The page itself (RSC) just fetches the product. */
export function ProductDetail({ product }: { product: Product }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants.find((v) => v.availableForSale)?.id ?? product.variants[0]?.id ?? null
  );

  const selectedVariant: ProductVariant | null = useMemo(
    () => product.variants.find((v) => v.id === selectedVariantId) ?? null,
    [product.variants, selectedVariantId]
  );

  // { "Size": ["Single Bar 85g", "Gift Box (3 Bars)"], ... }
  const optionGroups = useMemo(() => {
    const groups = new Map<string, Set<string>>();
    for (const variant of product.variants) {
      for (const option of variant.selectedOptions) {
        if (!groups.has(option.name)) groups.set(option.name, new Set());
        groups.get(option.name)?.add(option.value);
      }
    }
    return Array.from(groups.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  }, [product.variants]);

  function selectOption(name: string, value: string) {
    if (!selectedVariant) return;
    const nextOptions = selectedVariant.selectedOptions.map((o) =>
      o.name === name ? { ...o, value } : o
    );
    const match = product.variants.find((v) =>
      v.selectedOptions.every(
        (o) => nextOptions.find((n) => n.name === o.name)?.value === o.value
      )
    );
    if (match) setSelectedVariantId(match.id);
  }

  const activeImage = product.images[activeImageIndex];
  const price = selectedVariant?.price ?? product.priceRange.min;

  return (
    <main className="px-fluid-md py-fluid-xl">
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
                className="h-full w-full object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-fg/40">
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
          <p className="font-sofia text-lg text-fg/80">{formatMoney(price)}</p>
          <BodyText className="text-fg/80">{product.description}</BodyText>

          {optionGroups.map((group) => (
            <fieldset key={group.name} className="flex flex-col gap-fluid-xs">
              <legend className="font-sofia text-sm font-black uppercase tracking-[0.075em] text-fg/70">
                {group.name}
              </legend>
              <div className="flex flex-wrap gap-fluid-xs">
                {group.values.map((value) => {
                  const isSelected = selectedVariant?.selectedOptions.some(
                    (o) => o.name === group.name && o.value === value
                  );
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => selectOption(group.name, value)}
                      aria-pressed={isSelected}
                      className={`rounded-full border-2 px-fluid-sm py-1 font-sofia text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon ${
                        isSelected
                          ? "border-tf-cinnamon bg-tf-cinnamon text-tf-white"
                          : "border-tf-black/20 text-fg hover:border-tf-cinnamon"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="hidden md:block">
            <AddToCartButton product={product} variant={selectedVariant} className="w-full sm:w-auto" />
          </div>
        </div>
      </div>

      {/* Sticky mobile add-to-cart bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-fluid-sm border-t border-tf-black/10 bg-bg px-fluid-md py-fluid-sm shadow-[0_-4px_16px_rgba(0,0,0,0.08)] md:hidden">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-featureDeck text-base leading-tight text-fg">
            {product.title}
          </span>
          <span className="font-sofia text-sm text-fg/70">{formatMoney(price)}</span>
        </div>
        <AddToCartButton product={product} variant={selectedVariant} className="shrink-0" />
      </div>
    </main>
  );
}
