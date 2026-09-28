"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { AddToCartButton } from "./AddToCartButton";
import { applySellingPlanAdjustment, formatMoney } from "@/lib/shopify/format";
import type { Product, ProductVariant, SellingPlan, SellingPlanPriceAdjustment } from "@/lib/shopify/types";

// Sentinel for "one-time purchase" in the purchase-option radio group —
// a plain string alongside real selling plan ids keeps the selection
// state a single string instead of a `string | null` union everywhere
// it's read.
const ONE_TIME = "one-time";

function savingsBadge(adjustment: SellingPlanPriceAdjustment): string | null {
  if (!adjustment) return null;
  return adjustment.type === "percentage"
    ? `Save ${adjustment.percentage}%`
    : `Save ${formatMoney(adjustment.amount)}`;
}

/** Client half of the PDP: gallery, variant selection, purchase-option
 * (one-time vs. selling plan) selection, and the sticky mobile add-to-cart
 * bar. The page itself (RSC) just fetches the product. */
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

  // A product with exactly one variant whose only option is Shopify's own
  // "no real options" convention (option name "Title", value "Default
  // Title") has nothing for a selector to select between — showing one
  // disabled-feeling pill labeled "Default Title" is worse than showing
  // nothing.
  const hasOnlyDefaultVariant =
    product.variants.length === 1 &&
    optionGroups.length === 1 &&
    optionGroups[0].name === "Title" &&
    optionGroups[0].values.length === 1 &&
    optionGroups[0].values[0] === "Default Title";

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

  /* -------------------------------------------------------------- */
  /* Purchase options — one-time purchase vs. selling plans           */
  /* -------------------------------------------------------------- */

  // Flattened across every group — most products have exactly one
  // sellingPlanGroups entry (e.g. "Subscribe & Save"), and this UI treats
  // "which plan" as a single flat choice rather than nesting by group.
  const allSellingPlans: SellingPlan[] = useMemo(
    () => product.sellingPlanGroups.flatMap((group) => group.sellingPlans),
    [product.sellingPlanGroups]
  );

  // A selling plan group can target a subset of a product's variants —
  // only offer plans the *currently selected* variant actually allows
  // (ProductVariant.sellingPlanIds, from its own sellingPlanAllocations).
  const plansForSelectedVariant: SellingPlan[] = useMemo(() => {
    if (!selectedVariant) return [];
    const allowed = new Set(selectedVariant.sellingPlanIds);
    return allSellingPlans.filter((plan) => allowed.has(plan.id));
  }, [allSellingPlans, selectedVariant]);

  function defaultPurchaseOptionId(plans: SellingPlan[]): string {
    return product.requiresSellingPlan ? (plans[0]?.id ?? ONE_TIME) : ONE_TIME;
  }

  const [purchaseOptionId, setPurchaseOptionId] = useState<string>(() =>
    defaultPurchaseOptionId(plansForSelectedVariant)
  );
  // Tracks which variant `purchaseOptionId` was last reconciled against —
  // not shown anywhere, just this component's own bookkeeping.
  const [reconciledVariantId, setReconciledVariantId] = useState(selectedVariantId);

  // Keep the selection valid across a variant change: a plan that was
  // fine for the old variant may not exist on the new one (different
  // selling plan targeting). Adjusted right here during render (React's
  // own recommended pattern for "reset state when a specific value
  // changes" — see https://react.dev/learn/you-might-not-need-an-effect)
  // rather than in a useEffect, which would commit one stale render
  // first and cause a visible flash of the wrong purchase option.
  if (selectedVariantId !== reconciledVariantId) {
    setReconciledVariantId(selectedVariantId);
    const stillValid =
      purchaseOptionId === ONE_TIME
        ? !product.requiresSellingPlan
        : plansForSelectedVariant.some((p) => p.id === purchaseOptionId);
    if (!stillValid) setPurchaseOptionId(defaultPurchaseOptionId(plansForSelectedVariant));
  }

  const selectedSellingPlan =
    purchaseOptionId === ONE_TIME
      ? null
      : plansForSelectedVariant.find((p) => p.id === purchaseOptionId) ?? null;

  const activeImage = product.images[activeImageIndex];
  const basePrice = selectedVariant?.price ?? product.priceRange.min;
  const price = selectedSellingPlan
    ? applySellingPlanAdjustment(basePrice, selectedSellingPlan.priceAdjustment)
    : basePrice;

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

          {!hasOnlyDefaultVariant &&
            optionGroups.map((group) => (
              <fieldset key={group.name} className="flex flex-col gap-fluid-xs">
                <legend className="font-sans text-sm font-black uppercase tracking-[0.075em] text-fg/70">
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
                        className={`rounded-full border-2 px-fluid-sm py-1 font-sans text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon ${
                          isSelected
                            ? "border-tf-cinnamon-strong bg-tf-cinnamon-strong text-tf-white"
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

          {plansForSelectedVariant.length > 0 && (
            <fieldset className="flex flex-col gap-fluid-xs">
              <legend className="font-sans text-sm font-black uppercase tracking-[0.075em] text-fg/70">
                Purchase Options
              </legend>
              <div className="flex flex-col gap-fluid-xs">
                {!product.requiresSellingPlan && (
                  <label
                    className={`flex cursor-pointer items-center justify-between gap-fluid-sm rounded-xl border-2 px-fluid-sm py-fluid-xs transition-colors ${
                      purchaseOptionId === ONE_TIME
                        ? "border-tf-cinnamon-strong bg-tf-cinnamon-strong/5"
                        : "border-tf-black/20 hover:border-tf-cinnamon"
                    }`}
                  >
                    <span className="flex items-center gap-fluid-xs">
                      <input
                        type="radio"
                        name="purchase-option"
                        checked={purchaseOptionId === ONE_TIME}
                        onChange={() => setPurchaseOptionId(ONE_TIME)}
                        className="h-4 w-4 accent-tf-cinnamon-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon"
                      />
                      <span className="font-sans text-sm text-fg">One-time purchase</span>
                    </span>
                    <span className="font-sans text-sm text-fg/70">{formatMoney(basePrice)}</span>
                  </label>
                )}

                {plansForSelectedVariant.map((plan) => {
                  const isSelected = purchaseOptionId === plan.id;
                  const adjustedPrice = applySellingPlanAdjustment(basePrice, plan.priceAdjustment);
                  const badge = savingsBadge(plan.priceAdjustment);
                  return (
                    <label
                      key={plan.id}
                      className={`flex cursor-pointer items-start justify-between gap-fluid-sm rounded-xl border-2 px-fluid-sm py-fluid-xs transition-colors ${
                        isSelected
                          ? "border-tf-cinnamon-strong bg-tf-cinnamon-strong/5"
                          : "border-tf-black/20 hover:border-tf-cinnamon"
                      }`}
                    >
                      <span className="flex items-start gap-fluid-xs">
                        <input
                          type="radio"
                          name="purchase-option"
                          checked={isSelected}
                          onChange={() => setPurchaseOptionId(plan.id)}
                          className="mt-1 h-4 w-4 shrink-0 accent-tf-cinnamon-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon"
                        />
                        <span className="flex flex-col">
                          <span className="font-sans text-sm text-fg">{plan.name}</span>
                          {plan.description && (
                            <span className="font-sans text-sm text-fg/60">{plan.description}</span>
                          )}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end">
                        <span className="font-sans text-sm text-fg/70">{formatMoney(adjustedPrice)}</span>
                        {badge && (
                          <span className="font-sans text-sm font-black uppercase tracking-[0.075em] text-tf-cinnamon-strong">
                            {badge}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

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
