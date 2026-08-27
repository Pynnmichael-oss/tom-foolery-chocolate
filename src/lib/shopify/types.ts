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

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  selectedOptions: SelectedOption[];
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
}

/** Result of a `customerCreate` email-signup attempt (EmailSignupPopup). */
export interface SubscribeResult {
  success: boolean;
  /** User-facing message — set only when `success` is false. */
  error?: string;
}
