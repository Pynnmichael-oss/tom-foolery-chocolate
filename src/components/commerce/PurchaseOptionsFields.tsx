"use client";

import { applySellingPlanAdjustment, formatMoney } from "@/lib/shopify/format";
import { ONE_TIME_PURCHASE_OPTION } from "@/lib/hooks/useProductPurchaseOptions";
import type { useProductPurchaseOptions } from "@/lib/hooks/useProductPurchaseOptions";
import type { Money, SellingPlanPriceAdjustment } from "@/lib/shopify/types";

function savingsBadge(adjustment: SellingPlanPriceAdjustment): string | null {
  if (!adjustment) return null;
  return adjustment.type === "percentage"
    ? `Save ${adjustment.percentage}%`
    : `Save ${formatMoney(adjustment.amount)}`;
}

export interface PurchaseOptionsFieldsProps {
  /** Everything this needs from useProductPurchaseOptions(product), plus
   * the one flag (requiresSellingPlan) that lives on the product itself
   * rather than the hook's return value. */
  options: ReturnType<typeof useProductPurchaseOptions>;
  requiresSellingPlan: boolean;
  basePrice: Money;
}

/**
 * Variant-option pills + one-time/selling-plan radio group — the
 * selection UI shared by ProductDetail.tsx (PDP) and
 * FeaturedProductPanel.tsx (single-product collection layout). Purely
 * presentational: all state lives in useProductPurchaseOptions, passed in
 * as `options`.
 */
export function PurchaseOptionsFields({
  options,
  requiresSellingPlan,
  basePrice,
}: PurchaseOptionsFieldsProps) {
  const {
    optionGroups,
    hasOnlyDefaultVariant,
    selectedVariant,
    selectOption,
    plansForSelectedVariant,
    purchaseOptionId,
    setPurchaseOptionId,
  } = options;

  return (
    <>
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
            {!requiresSellingPlan && (
              <label
                className={`flex cursor-pointer items-center justify-between gap-fluid-sm rounded-xl border-2 px-fluid-sm py-fluid-xs transition-colors ${
                  purchaseOptionId === ONE_TIME_PURCHASE_OPTION
                    ? "border-tf-cinnamon-strong bg-tf-cinnamon-strong/5"
                    : "border-tf-black/20 hover:border-tf-cinnamon"
                }`}
              >
                <span className="flex items-center gap-fluid-xs">
                  <input
                    type="radio"
                    name="purchase-option"
                    checked={purchaseOptionId === ONE_TIME_PURCHASE_OPTION}
                    onChange={() => setPurchaseOptionId(ONE_TIME_PURCHASE_OPTION)}
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
    </>
  );
}
