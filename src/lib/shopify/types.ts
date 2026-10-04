/**
 * Normalized shapes used everywhere in the app. Both the real Shopify path
 * (queries.ts, transforming raw Storefront API responses) and the mock path
 * (mock-data.ts, already in this shape) produce exactly this — nothing else
 * in the app needs to know or care which one is active.
 */

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface ProductImage {
  url: string;
  altText: string | null;
  width?: number;
  height?: number;
}

export interface SelectedOption {
  name: string;
  value: string;
}

/** A selling plan's price adjustment, collapsed from Shopify's
 * `SellingPlanPriceAdjustmentValue` union (only the two variants this app
 * queries — percentage and fixed-amount-off — see queries.ts) down to a
 * single discriminated shape the UI can switch on directly. `null` when a
 * plan has no adjustments at all (same price as one-time). Only the
 * *first* `priceAdjustments` entry is kept — real stores almost always
 * have exactly one; a plan with tiered adjustments per interval is a rarer
 * case this UI doesn't attempt to represent. */
export type SellingPlanPriceAdjustment =
  | { type: "percentage"; percentage: number }
  | { type: "fixed_amount"; amount: Money }
  | null;

export interface SellingPlan {
  id: string;
  name: string;
  description: string | null;
  priceAdjustment: SellingPlanPriceAdjustment;
}

export interface SellingPlanGroup {
  name: string;
  options: Array<{ name: string; values: string[] }>;
  sellingPlans: SellingPlan[];
}

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  selectedOptions: SelectedOption[];
  /** IDs of the selling plans this specific variant can be purchased
   * under (from its `sellingPlanAllocations`) — a selling plan group can
   * target a subset of a product's variants, so this isn't always every
   * plan in `Product.sellingPlanGroups`. Empty when the variant supports
   * no selling plans at all. */
  sellingPlanIds: string[];
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  images: ProductImage[];
  priceRange: { min: Money; max: Money };
  variants: ProductVariant[];
  /** True when this product can *only* be bought on a selling plan —
   * `sellingPlanGroups` will be non-empty whenever this is true, but the
   * reverse isn't required (a product can offer selling plans while still
   * allowing a one-time purchase). */
  requiresSellingPlan: boolean;
  sellingPlanGroups: SellingPlanGroup[];
}

/**
 * Trimmed product shape for collection-grid contexts (e.g. the homepage
 * "Featured" rail) — mirrors what a Storefront API collection query
 * actually returns when you only ask for a card's worth of fields
 * (`featuredImage` singular, `priceRange.minVariantPrice` only) rather
 * than the full gallery + variant list the PDP-oriented `Product` needs.
 */
export interface FeaturedProduct {
  id: string;
  handle: string;
  title: string;
  image: ProductImage;
  price: Money;
}

/**
 * A Storefront collection page's worth of data — full `Product` shape per
 * item (not the trimmed `FeaturedProduct`) since `/collections/[handle]`
 * reuses the same grid/card components as `/shop`, which need the full
 * product (variants, selling plans) for `AddToCartButton`.
 */
export interface Collection {
  handle: string;
  title: string;
  description: string;
  products: Product[];
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandiseId: string;
  variantTitle: string;
  price: Money;
  lineTotal: Money;
  product: {
    title: string;
    handle: string;
    image: ProductImage | null;
  };
  /** Selling plan this line was purchased under, if any — `null` for a
   * plain one-time-purchase line. Only the name is kept; nothing in the
   * cart UI needs the plan's id or price adjustment once it's already a
   * line item (the price shown is always the line's actual `price`,
   * already adjusted by Shopify). */
  sellingPlanName: string | null;
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: Money;
  lines: CartLine[];
}

export interface CartLineInput {
  merchandiseId: string;
  quantity: number;
  /** Shopify's own `CartLineInput.sellingPlanId` — omit entirely for a
   * one-time purchase (passing `undefined` rather than `null`, since
   * that's what lets it drop out of the JSON body instead of sending an
   * explicit null Shopify would need to interpret). */
  sellingPlanId?: string;
}

/**
 * Result of a cart mutation Server Action (add/update/remove line). Every
 * action in `shopify/actions.ts` catches its own failures and returns this
 * instead of throwing — a thrown Server Action error reaches the client as
 * an opaque, digest-only "Minified React error #441" and blanks the whole
 * page, so callers (CartProvider) always get a value to branch on instead.
 */
export type CartResult = { success: true; cart: Cart } | { success: false; error: string };

/** One of Shopify's built-in shop policies (Settings → Policies in the
 * admin). `bodyHtml` is merchant-authored rich text from the admin's own
 * policy editor — same trust level as `Product.descriptionHtml` — never
 * user-submitted. */
export interface ShopPolicy {
  title: string;
  bodyHtml: string;
  handle: string;
}

export interface ShopPolicies {
  privacyPolicy: ShopPolicy | null;
  refundPolicy: ShopPolicy | null;
  shippingPolicy: ShopPolicy | null;
  termsOfService: ShopPolicy | null;
}
