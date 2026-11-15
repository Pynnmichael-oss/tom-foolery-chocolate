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
 * "$9.00" when every variant shares one price, "From $9.00" when they
 * don't — shared between ProductCard.tsx (grid cards) and
 * FeaturedProductPanel.tsx (single-product collection layout), both of
 * which show this as the static, pre-selection headline price.
 */
export function priceRangeLabel(priceRange: { min: Money; max: Money }): string {
  const { min, max } = priceRange;
  return min.amount === max.amount ? formatMoney(min) : `From ${formatMoney(min)}`;
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

/** Shopify CDN URL resized to `width` px (the CDN resizes on the fly via
 * the `width` query param). Used for share images: product photos are
 * uploaded at ~3000px PNG, far heavier than a social card needs. Any
 * non-Shopify URL (mock/placeholder imagery) is returned untouched. */
export function shopifyImageAtWidth(
  image: { url: string; width?: number; height?: number },
  width: number
): { url: string; width?: number; height?: number } {
  if (!image.url.includes("cdn.shopify.com") || (image.width && image.width <= width)) return image;
  const url = `${image.url}${image.url.includes("?") ? "&" : "?"}width=${width}`;
  const height =
    image.width && image.height ? Math.round((image.height / image.width) * width) : undefined;
  return { url, width, height };
}
