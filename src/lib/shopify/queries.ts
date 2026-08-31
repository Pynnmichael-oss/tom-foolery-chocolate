import { isShopifyConfigured, shopifyFetch, ShopifyApiError } from "./client";
import * as mock from "./mock-data";
import type {
  Cart,
  CartLine,
  CartLineInput,
  FeaturedProduct,
  Money,
  Product,
  ProductVariant,
  SubscribeResult,
} from "./types";

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

// TODO(storefront): create a collection with this handle in Shopify admin
// (or point it at whichever one should feed the homepage rail) — the
// query/normalizer below are already written and wired into
// getFeaturedProducts(), so nothing else needs to change once it exists.
const FEATURED_COLLECTION_HANDLE = "featured";

const FEATURED_PRODUCTS_QUERY = `#graphql
  query FeaturedProducts($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      products(first: $first) {
        nodes {
          id
          handle
          title
          featuredImage { url altText width height }
          priceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }
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

const CUSTOMER_CREATE_MUTATION = `#graphql
  mutation CustomerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer { id }
      customerUserErrors { field message code }
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

interface RawFeaturedProduct {
  id: string;
  handle: string;
  title: string;
  featuredImage: RawImage | null;
  priceRange: { minVariantPrice: Money };
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

function normalizeFeaturedProduct(product: RawFeaturedProduct): FeaturedProduct {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    // Storefront allows a null featuredImage (e.g. a product with no
    // media yet) — fall back to an empty, alt-less image rather than
    // throwing, same tolerance normalizeProduct's images.nodes.map gets
    // for free from an empty array.
    image: product.featuredImage
      ? normalizeImage(product.featuredImage)
      : { url: "", altText: null },
    price: product.priceRange.minVariantPrice,
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
/* Featured products (homepage rail)                                    */
/* ------------------------------------------------------------------ */

export async function getFeaturedProducts(first = 3): Promise<FeaturedProduct[]> {
  if (!isShopifyConfigured()) return mock.getMockFeaturedProducts();

  try {
    const data = await shopifyFetch<{
      collection: { products: { nodes: RawFeaturedProduct[] } } | null;
    }>({
      query: FEATURED_PRODUCTS_QUERY,
      variables: { handle: FEATURED_COLLECTION_HANDLE, first },
      revalidate: 3600,
      tags: ["products", `collection:${FEATURED_COLLECTION_HANDLE}`],
    });
    const nodes = data.collection?.products.nodes ?? [];
    // Collection doesn't exist yet (or is empty) — mock fallback keeps the
    // homepage rail populated instead of silently rendering nothing.
    return nodes.length > 0
      ? nodes.map(normalizeFeaturedProduct)
      : mock.getMockFeaturedProducts();
  } catch (error) {
    console.error("[shopify] getFeaturedProducts failed, falling back to mock data:", error);
    return mock.getMockFeaturedProducts();
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

/* ------------------------------------------------------------------ */
/* Customer signup (EmailSignupPopup)                                   */
/* ------------------------------------------------------------------ */

interface RawCustomerUserError {
  field: string[] | null;
  message: string;
  code: string;
}

export async function createCustomer(email: string): Promise<SubscribeResult> {
  if (!isShopifyConfigured()) return mock.subscribeMockCustomer(email);

  try {
    const data = await shopifyFetch<{
      customerCreate: {
        customer: { id: string } | null;
        customerUserErrors: RawCustomerUserError[];
      };
    }>({
      query: CUSTOMER_CREATE_MUTATION,
      variables: { input: { email, acceptsMarketing: true } },
      cache: "no-store",
      server: true, // privileged mutation — uses SHOPIFY_STOREFRONT_PRIVATE_TOKEN
    });

    const { customer, customerUserErrors } = data.customerCreate;
    if (customerUserErrors.length > 0) {
      // "Email has already been taken" (code TAKEN) just means this visitor
      // already signed up on a previous visit — treat that as success
      // rather than surfacing it as an error to retry.
      if (customerUserErrors.some((e) => e.code === "TAKEN")) {
        return { success: true };
      }
      return { success: false, error: customerUserErrors[0].message };
    }
    return { success: Boolean(customer) };
  } catch (error) {
    console.error("[shopify] createCustomer failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
