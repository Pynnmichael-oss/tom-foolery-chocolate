import type { Money, SellingPlanPriceAdjustment } from "./types";

export function formatMoney({ amount, currencyCode }: Money): string {
  const value = Number(amount);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(value);
  } catch {
    return `${amount} ${currencyCode}`;
  }
}

/**
 * Applies a selling plan's price adjustment to a base price. Shared
 * between ProductDetail.tsx (showing the discounted price for each
 * purchase option before it's ever added to a cart) and mock-data.ts
 * (computing what a real Shopify cart line's price would already reflect
 * server-side, so the mock cart flow matches real behavior) — one place
 * for this math rather than two copies drifting apart.
 */
export function applySellingPlanAdjustment(base: Money, adjustment: SellingPlanPriceAdjustment): Money {
  if (!adjustment) return base;
  const baseAmount = Number(base.amount);
  const adjusted =
    adjustment.type === "percentage"
      ? baseAmount * (1 - adjustment.percentage / 100)
      : baseAmount - Number(adjustment.amount.amount);
  return { amount: Math.max(adjusted, 0).toFixed(2), currencyCode: base.currencyCode };
}
