"use client";

import { useMemo, useState } from "react";
import { applySellingPlanAdjustment } from "@/lib/shopify/format";
import type { Product, ProductVariant, SellingPlan } from "@/lib/shopify/types";

// Sentinel for "one-time purchase" in the purchase-option radio group —
// a plain string alongside real selling plan ids keeps the selection
// state a single string instead of a `string | null` union everywhere
// it's read.
export const ONE_TIME_PURCHASE_OPTION = "one-time";

/**
 * Variant + selling-plan selection state for a single product — the state
 * machine behind both the PDP (ProductDetail.tsx) and the collection
 * page's single-product featured layout (FeaturedProductPanel.tsx). Pulled
 * out of ProductDetail so both call sites share one implementation instead
 * of two copies of this reconciliation logic drifting apart; the
 * surrounding layout (gallery vs. image-left panel, sticky mobile bar or
 * not) stays with each caller.
 */
export function useProductPurchaseOptions(product: Product) {
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
    return product.requiresSellingPlan ? (plans[0]?.id ?? ONE_TIME_PURCHASE_OPTION) : ONE_TIME_PURCHASE_OPTION;
  }

  const [purchaseOptionId, setPurchaseOptionId] = useState<string>(() =>
    defaultPurchaseOptionId(plansForSelectedVariant)
  );
  // Tracks which variant `purchaseOptionId` was last reconciled against —
  // not shown anywhere, just this hook's own bookkeeping.
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
      purchaseOptionId === ONE_TIME_PURCHASE_OPTION
        ? !product.requiresSellingPlan
        : plansForSelectedVariant.some((p) => p.id === purchaseOptionId);
    if (!stillValid) setPurchaseOptionId(defaultPurchaseOptionId(plansForSelectedVariant));
  }

  const selectedSellingPlan =
    purchaseOptionId === ONE_TIME_PURCHASE_OPTION
      ? null
      : plansForSelectedVariant.find((p) => p.id === purchaseOptionId) ?? null;

  const basePrice = selectedVariant?.price ?? product.priceRange.min;
  const price = selectedSellingPlan
    ? applySellingPlanAdjustment(basePrice, selectedSellingPlan.priceAdjustment)
    : basePrice;

  return {
    selectedVariant,
    optionGroups,
    hasOnlyDefaultVariant,
    selectOption,
    plansForSelectedVariant,
    purchaseOptionId,
    setPurchaseOptionId,
    selectedSellingPlan,
    basePrice,
    price,
  };
}
