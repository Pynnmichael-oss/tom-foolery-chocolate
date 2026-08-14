import { isShopifyConfigured, shopifyFetch, ShopifyApiError } from "./client";
import * as mock from "./mock-data";
import type { Cart, CartLine, CartLineInput, Money, Product, ProductVariant } from "./types";

/* ------------------------------------------------------------------ */
/* GraphQL documents                                                    */
/* ------------------------------------------------------------------ */

const PRODUCT_FRAGMENT = `#graphql
  fragment ProductFields on Product {
    id
    handle
    title
    description
    descriptionHtml
    availableForSale
    images(first: 8) {
      nodes { url altText width height }
    }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    variants(first: 25) {
      nodes {
        id
        title
        availableForSale
        price { amount currencyCode }
        selectedOptions { name value }
      }
    }
  }
`;

const CART_FRAGMENT = `#graphql
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          totalAmount { amount currencyCode }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            price { amount currencyCode }
            product {
              title
              handle
              images(first: 1) {
                nodes { url altText width height }
              }
            }
          }
        }
      }
    }
  }
`;

const PRODUCTS_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query Products($first: Int!) {
    products(first: $first) {
      nodes { ...ProductFields }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query ProductByHandle($handle: String!) {
    product(handle: $handle) { ...ProductFields }
  }
`;

const CART_QUERY = `#graphql
  ${CART_FRAGMENT}
  query CartByID($cartId: ID!) {
    cart(id: $cartId) { ...CartFields }
  }
`;

const CART_CREATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

const CART_LINES_ADD_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = `#graphql
  ${CART_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

/* ------------------------------------------------------------------ */
/* Raw Storefront API response shapes (private to this module)          */
/* ------------------------------------------------------------------ */

interface RawImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

interface RawVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  selectedOptions: { name: string; value: string }[];
}

interface RawProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  images: { nodes: RawImage[] };
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  variants: { nodes: RawVariant[] };
}

interface RawCartLine {
  id: string;
  quantity: number;
  cost: { totalAmount: Money };
  merchandise: {
    id: string;
    title: string;
    price: Money;
    product: { title: string; handle: string; images: { nodes: RawImage[] } };
  };
}

interface RawCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money };
  lines: { nodes: RawCartLine[] };
}

interface UserError {
  field: string[] | null;
  message: string;
}

/* ------------------------------------------------------------------ */
/* Normalization                                                        */
/* ------------------------------------------------------------------ */

function normalizeImage(image: RawImage) {
  return {
    url: image.url,
    altText: image.altText,
    width: image.width ?? undefined,
    height: image.height ?? undefined,
  };
}

function normalizeVariant(variant: RawVariant): ProductVariant {
  return {
    id: variant.id,
    title: variant.title,
    availableForSale: variant.availableForSale,
    price: variant.price,
    selectedOptions: variant.selectedOptions,
  };
}

function normalizeProduct(product: RawProduct): Product {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    descriptionHtml: product.descriptionHtml,
    availableForSale: product.availableForSale,
    images: product.images.nodes.map(normalizeImage),
    priceRange: {
      min: product.priceRange.minVariantPrice,
      max: product.priceRange.maxVariantPrice,
    },
    variants: product.variants.nodes.map(normalizeVariant),
  };
}

function normalizeCartLine(line: RawCartLine): CartLine {
  const image = line.merchandise.product.images.nodes[0];
  return {
    id: line.id,
    quantity: line.quantity,
    merchandiseId: line.merchandise.id,
    variantTitle: line.merchandise.title,
    price: line.merchandise.price,
    lineTotal: line.cost.totalAmount,
    product: {
      title: line.merchandise.product.title,
      handle: line.merchandise.product.handle,
      image: image ? normalizeImage(image) : null,
    },
  };
}

function normalizeCart(cart: RawCart): Cart {
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    totalQuantity: cart.totalQuantity,
    subtotal: cart.cost.subtotalAmount,
    lines: cart.lines.nodes.map(normalizeCartLine),
  };
}

function assertNoUserErrors(errors: UserError[] | undefined, operation: string): void {
  if (errors && errors.length > 0) {
    throw new ShopifyApiError(
      `Shopify ${operation} returned user errors: ${errors.map((e) => e.message).join("; ")}`
    );
  }
}

/* ------------------------------------------------------------------ */
/* Products                                                             */
/* ------------------------------------------------------------------ */

export async function getProducts(first = 24): Promise<Product[]> {
  if (!isShopifyConfigured()) return mock.getMockProducts();

  try {
    const data = await shopifyFetch<{ products: { nodes: RawProduct[] } }>({
      query: PRODUCTS_QUERY,
      variables: { first },
      revalidate: 3600,
      tags: ["products"],
    });
    return data.products.nodes.map(normalizeProduct);
  } catch (error) {
    console.error("[shopify] getProducts failed, falling back to mock data:", error);
    return mock.getMockProducts();
  }
}

export async function getProduct(handle: string): Promise<Product | null> {
  if (!isShopifyConfigured()) return mock.getMockProduct(handle);

  try {
    const data = await shopifyFetch<{ product: RawProduct | null }>({
      query: PRODUCT_BY_HANDLE_QUERY,
      variables: { handle },
      revalidate: 3600,
      tags: [`product:${handle}`],
    });
    return data.product ? normalizeProduct(data.product) : null;
  } catch (error) {
    console.error(`[shopify] getProduct(${handle}) failed, falling back to mock data:`, error);
    return mock.getMockProduct(handle);
  }
}

/* ------------------------------------------------------------------ */
/* Cart                                                                  */
/* ------------------------------------------------------------------ */

export async function getCart(cartId: string): Promise<Cart | null> {
  if (!isShopifyConfigured()) return mock.getMockCart(cartId);

  try {
    const data = await shopifyFetch<{ cart: RawCart | null }>({
      query: CART_QUERY,
      variables: { cartId },
      cache: "no-store",
    });
    return data.cart ? normalizeCart(data.cart) : null;
  } catch (error) {
    console.error("[shopify] getCart failed:", error);
    return null;
  }
}

export async function createCart(lines: CartLineInput[] = []): Promise<Cart> {
  if (!isShopifyConfigured()) return mock.createMockCart(lines);

  const data = await shopifyFetch<{
    cartCreate: { cart: RawCart; userErrors: UserError[] };
  }>({
    query: CART_CREATE_MUTATION,
    variables: { lines },
    cache: "no-store",
  });
  assertNoUserErrors(data.cartCreate.userErrors, "createCart");
  return normalizeCart(data.cartCreate.cart);
}

export async function addLines(cartId: string, lines: CartLineInput[]): Promise<Cart> {
  if (!isShopifyConfigured()) return mock.addMockLines(cartId, lines);

  const data = await shopifyFetch<{
    cartLinesAdd: { cart: RawCart; userErrors: UserError[] };
  }>({
    query: CART_LINES_ADD_MUTATION,
    variables: { cartId, lines },
    cache: "no-store",
  });
  assertNoUserErrors(data.cartLinesAdd.userErrors, "addLines");
  return normalizeCart(data.cartLinesAdd.cart);
}

export async function updateLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
  if (!isShopifyConfigured()) return mock.updateMockLine(cartId, lineId, quantity);

  const data = await shopifyFetch<{
    cartLinesUpdate: { cart: RawCart; userErrors: UserError[] };
  }>({
    query: CART_LINES_UPDATE_MUTATION,
    variables: { cartId, lines: [{ id: lineId, quantity }] },
    cache: "no-store",
  });
  assertNoUserErrors(data.cartLinesUpdate.userErrors, "updateLine");
  return normalizeCart(data.cartLinesUpdate.cart);
}

export async function removeLine(cartId: string, lineId: string): Promise<Cart> {
  if (!isShopifyConfigured()) return mock.removeMockLine(cartId, lineId);

  const data = await shopifyFetch<{
    cartLinesRemove: { cart: RawCart; userErrors: UserError[] };
  }>({
    query: CART_LINES_REMOVE_MUTATION,
    variables: { cartId, lineIds: [lineId] },
    cache: "no-store",
  });
  assertNoUserErrors(data.cartLinesRemove.userErrors, "removeLine");
  return normalizeCart(data.cartLinesRemove.cart);
}
