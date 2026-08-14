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
