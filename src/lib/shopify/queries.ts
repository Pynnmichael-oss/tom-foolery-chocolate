import { isProductionRuntime, isShopifyConfigured, shopifyFetch, ShopifyApiError } from "./client";
import * as mock from "./mock-data";
import type {
  Cart,
  CartLine,
  CartLineInput,
  Collection,
  FeaturedProduct,
  Money,
  Product,
  ProductVariant,
  SellingPlan,
  SellingPlanGroup,
  SellingPlanPriceAdjustment,
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
    requiresSellingPlan
    sellingPlanGroups(first: 5) {
      nodes {
        name
        options { name values }
        sellingPlans(first: 10) {
          nodes {
            id
            name
            description
            priceAdjustments {
              adjustmentValue {
                __typename
                ... on SellingPlanPercentagePriceAdjustment { adjustmentPercentage }
                ... on SellingPlanFixedAmountPriceAdjustment { adjustmentAmount { amount currencyCode } }
              }
            }
          }
        }
      }
    }
    variants(first: 25) {
      nodes {
        id
        title
        availableForSale
        price { amount currencyCode }
        selectedOptions { name value }
        sellingPlanAllocations(first: 10) {
          nodes {
            sellingPlan { id }
          }
        }
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
        sellingPlanAllocation {
          sellingPlan { name }
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

// Full product fragment (not the trimmed FeaturedProduct shape) — a
// collection page reuses /shop's grid/card components, which need the
// complete Product (variants, selling plans) for AddToCartButton.
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query CollectionByHandle($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      handle
      title
      description
      products(first: $first) {
        nodes { ...ProductFields }
      }
    }
  }
`;

// Handles only — feeds generateStaticParams() and the sitemap, neither of
// which needs more than that per collection.
const COLLECTION_HANDLES_QUERY = `#graphql
  query CollectionHandles {
    collections(first: 100) {
      nodes { handle }
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
  sellingPlanAllocations: { nodes: { sellingPlan: { id: string } }[] };
}

/** Raw shape of `SellingPlanPriceAdjustmentValue` — a GraphQL union, so
 * only the branch matching `__typename` actually has its own field
 * populated; TypeScript can't narrow that for us the way GraphQL does; see
 * `normalizeSellingPlanPriceAdjustment` for the runtime switch. */
interface RawSellingPlanPriceAdjustmentValue {
  __typename: string;
  adjustmentPercentage?: number;
  adjustmentAmount?: Money;
}

interface RawSellingPlan {
  id: string;
  name: string;
  description: string | null;
  priceAdjustments: { adjustmentValue: RawSellingPlanPriceAdjustmentValue }[];
}

interface RawSellingPlanGroup {
  name: string;
  options: { name: string; values: string[] }[];
  sellingPlans: { nodes: RawSellingPlan[] };
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
  requiresSellingPlan: boolean;
  sellingPlanGroups: { nodes: RawSellingPlanGroup[] };
  variants: { nodes: RawVariant[] };
}

interface RawCollection {
  handle: string;
  title: string;
  description: string;
  products: { nodes: RawProduct[] };
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
  sellingPlanAllocation: { sellingPlan: { name: string } } | null;
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
    sellingPlanIds: variant.sellingPlanAllocations.nodes.map((n) => n.sellingPlan.id),
  };
}

/** `adjustmentValue` is a GraphQL union — only the branch matching
 * `__typename` actually has data, everything else on the raw shape is
 * `undefined` regardless of what TypeScript's optional-field typing
 * suggests. `null` covers both "this plan has no price adjustments at
 * all" and the union's third member (a flat new-price override), which
 * this app doesn't query for (see the PRODUCT_FRAGMENT comment) and so
 * has no representation to normalize into here. */
function normalizeSellingPlanPriceAdjustment(
  raw: RawSellingPlan["priceAdjustments"][number] | undefined
): SellingPlanPriceAdjustment {
  const value = raw?.adjustmentValue;
  if (!value) return null;
  if (value.__typename === "SellingPlanPercentagePriceAdjustment" && value.adjustmentPercentage != null) {
    return { type: "percentage", percentage: value.adjustmentPercentage };
  }
  if (value.__typename === "SellingPlanFixedAmountPriceAdjustment" && value.adjustmentAmount) {
    return { type: "fixed_amount", amount: value.adjustmentAmount };
  }
  return null;
}

function normalizeSellingPlan(plan: RawSellingPlan): SellingPlan {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    // Only the first adjustment — see SellingPlanPriceAdjustment's own
    // doc comment in types.ts for why.
    priceAdjustment: normalizeSellingPlanPriceAdjustment(plan.priceAdjustments[0]),
  };
}

function normalizeSellingPlanGroup(group: RawSellingPlanGroup): SellingPlanGroup {
  return {
    name: group.name,
    options: group.options,
    sellingPlans: group.sellingPlans.nodes.map(normalizeSellingPlan),
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
    requiresSellingPlan: product.requiresSellingPlan,
    sellingPlanGroups: product.sellingPlanGroups.nodes.map(normalizeSellingPlanGroup),
  };
}

function normalizeCollection(collection: RawCollection): Collection {
  return {
    handle: collection.handle,
    title: collection.title,
    description: collection.description,
    products: collection.products.nodes.map(normalizeProduct),
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
    sellingPlanName: line.sellingPlanAllocation?.sellingPlan.name ?? null,
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
    // Shopify's own userErrors copy (e.g. "Variant can only be purchased
    // with a selling plan.") is written to be shown to a customer as-is —
    // passed through as `userMessage` so the Server Action layer
    // (shopify/actions.ts) can surface it directly instead of genericizing it.
    const messages = errors.map((e) => e.message).join(" ");
    throw new ShopifyApiError(
      `Shopify ${operation} returned user errors: ${messages}`,
      undefined,
      messages
    );
  }
}

/* ------------------------------------------------------------------ */
/* Products                                                             */
/* ------------------------------------------------------------------ */

/**
 * Shared by every reader below whose catch block used to always fall
 * back to mock data on a real Shopify failure — see mock-data.ts's own
 * top comment for the full rule this implements. In production, this
 * rethrows instead of swallowing the error: ISR means a *revalidation*
 * failure on an already-built page keeps serving the last good static
 * output automatically (Next's own behavior, nothing this function needs
 * to do), so the rethrow only actually surfaces for a genuine first-ever
 * render failure — which is exactly when it needs to surface, rather
 * than quietly showing fake demo products to a real customer. Outside
 * production (including Vercel Preview — see isProductionRuntime),
 * mock data keeps standing in, same as always.
 *
 * `mockValue` is a thunk, not a plain value, so it's never even evaluated
 * in production, where it wouldn't be used anyway.
 */
function handleReadFailure<T>(error: unknown, context: string, mockValue: () => T): T {
  console.error(`[shopify] ${context} failed:`, error);
  if (isProductionRuntime()) throw error;
  console.error(`[shopify] ${context}: falling back to mock data (non-production).`);
  return mockValue();
}

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
    return handleReadFailure(error, "getProducts", () => mock.getMockProducts());
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
    return handleReadFailure(error, `getProduct(${handle})`, () => mock.getMockProduct(handle));
  }
}

/* ------------------------------------------------------------------ */
/* Collections (/collections/[handle])                                  */
/* ------------------------------------------------------------------ */

export async function getCollection(handle: string, first = 24): Promise<Collection | null> {
  if (!isShopifyConfigured()) return mock.getMockCollection(handle);

  try {
    const data = await shopifyFetch<{ collection: RawCollection | null }>({
      query: COLLECTION_QUERY,
      variables: { handle, first },
      revalidate: 3600,
      tags: ["products", `collection:${handle}`],
    });
    return data.collection ? normalizeCollection(data.collection) : null;
  } catch (error) {
    return handleReadFailure(error, `getCollection(${handle})`, () => mock.getMockCollection(handle));
  }
}

/** Every collection handle — feeds generateStaticParams() and the sitemap.
 * Not filtered by product count: an empty collection still gets a static
 * page (real 404 is reserved for a handle that doesn't exist at all). */
export async function getCollectionHandles(): Promise<string[]> {
  if (!isShopifyConfigured()) return mock.getMockCollectionHandles();

  try {
    const data = await shopifyFetch<{ collections: { nodes: { handle: string }[] } }>({
      query: COLLECTION_HANDLES_QUERY,
      revalidate: 3600,
      tags: ["products"],
    });
    return data.collections.nodes.map((n) => n.handle);
  } catch (error) {
    return handleReadFailure(error, "getCollectionHandles", () => mock.getMockCollectionHandles());
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
    // homepage rail populated instead of silently rendering nothing. Not
    // an error path (the query succeeded; there's just no data), so this
    // one's untouched by handleReadFailure's production/non-production
    // split below — an empty "featured" collection is a legitimate
    // Shopify state, not a failure to recover from.
    return nodes.length > 0
      ? nodes.map(normalizeFeaturedProduct)
      : mock.getMockFeaturedProducts();
  } catch (error) {
    return handleReadFailure(error, "getFeaturedProducts", () => mock.getMockFeaturedProducts());
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
