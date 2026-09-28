/**
 * In-memory fallback "backend," used in two situations — both gated so
 * this can never stand in for a real customer-facing production request:
 *
 * 1. isShopifyConfigured() is false (see client.ts) — no Shopify
 *    credentials at all. No Shopify credentials required to build, run,
 *    or click through the whole commerce flow, cart included.
 * 2. A real Shopify API call throws, but ONLY outside production (see
 *    isProductionRuntime() in client.ts, and queries.ts's
 *    handleReadFailure) — graceful degradation while developing/on a
 *    Vercel Preview deploy with a flaky or misconfigured token, say.
 *
 * In production, a real Shopify read failure is rethrown instead of
 * falling back here — see queries.ts's handleReadFailure for why (short
 * version: ISR already keeps serving the last good page on a
 * revalidation failure; falling back to mock data would instead risk
 * showing a real customer fake demo products, e.g. one of the selling-
 * plan demo entries below, as if they were purchasable). The product
 * page and shop grid (src/app/shop/error.tsx) have their own on-brand
 * error state for the one case ISR can't paper over: a genuine
 * first-ever render with no prior successful build to fall back to.
 *
 * Data shapes match the normalized types in types.ts exactly, so nothing
 * downstream needs to know mock data is in play.
 */
import { applySellingPlanAdjustment } from "./format";
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
  ShopPolicies,
} from "./types";

function placeholderImage(label: string, bg: string, fg = "FFFFFF"): {
  url: string;
  altText: string;
  width: number;
  height: number;
} {
  // `.png` on the text-color segment — placehold.co defaults to SVG
  // otherwise, which next/image refuses to optimize (dangerouslyAllowSVG).
  return {
    url: `https://placehold.co/1000x1000/${bg}/${fg}.png?text=${encodeURIComponent(label)}`,
    altText: `${label} — placeholder product photo`,
    width: 1000,
    height: 1000,
  };
}

function money(amount: number): { amount: string; currencyCode: string } {
  return { amount: amount.toFixed(2), currencyCode: "USD" };
}

function variant(
  id: string,
  size: string,
  price: number,
  availableForSale = true,
  sellingPlanIds: string[] = []
): ProductVariant {
  return {
    id,
    title: size,
    availableForSale,
    price: money(price),
    selectedOptions: [{ name: "Size", value: size }],
    sellingPlanIds,
  };
}

function priceRangeFrom(variants: ProductVariant[]) {
  const amounts = variants.map((v) => Number(v.price.amount));
  const currencyCode = variants[0]?.price.currencyCode ?? "USD";
  return {
    min: { amount: Math.min(...amounts).toFixed(2), currencyCode },
    max: { amount: Math.max(...amounts).toFixed(2), currencyCode },
  };
}

function makeProduct(input: {
  id: string;
  handle: string;
  title: string;
  description: string;
  bg: string;
  /** Text color for the placeholder image — pick black for light bgs. */
  fg?: string;
  variants: ProductVariant[];
  /** Subscription-only — see types.ts's Product.requiresSellingPlan. */
  requiresSellingPlan?: boolean;
  sellingPlanGroups?: SellingPlanGroup[];
}): Product {
  return {
    id: input.id,
    handle: input.handle,
    title: input.title,
    description: input.description,
    descriptionHtml: `<p>${input.description}</p>`,
    availableForSale: input.variants.some((v) => v.availableForSale),
    images: [
      placeholderImage(input.title, input.bg, input.fg),
      placeholderImage(`${input.title} — detail`, input.bg, input.fg),
    ],
    priceRange: priceRangeFrom(input.variants),
    variants: input.variants,
    requiresSellingPlan: input.requiresSellingPlan ?? false,
    sellingPlanGroups: input.sellingPlanGroups ?? [],
  };
}

// ---------------------------------------------------------------------
// Selling plans — exercises the purchase-options UI (ProductDetail.tsx)
// without needing real Shopify subscription products configured. Two
// products below use these: one offers a subscription alongside a
// one-time purchase, the other is subscription-only (requiresSellingPlan)
// with a single Default Title variant, so it also exercises the "hide
// the variant selector" case at the same time.
// ---------------------------------------------------------------------

const SUBSCRIBE_AND_SAVE_GROUP: SellingPlanGroup = {
  name: "Subscribe & Save",
  options: [{ name: "Delivery every", values: ["30 days", "60 days"] }],
  sellingPlans: [
    {
      id: "gid://mock/SellingPlan/1",
      name: "Deliver every 30 days",
      description: "Cancel or pause anytime.",
      priceAdjustment: { type: "percentage", percentage: 10 },
    },
    {
      id: "gid://mock/SellingPlan/2",
      name: "Deliver every 60 days",
      description: "Cancel or pause anytime.",
      priceAdjustment: { type: "percentage", percentage: 5 },
    },
  ],
};

const CHOCOLATE_CLUB_GROUP: SellingPlanGroup = {
  name: "Chocolate Club",
  options: [{ name: "Frequency", values: ["Monthly"] }],
  sellingPlans: [
    {
      id: "gid://mock/SellingPlan/3",
      name: "Monthly Chocolate Club",
      description: "A new flavor every month, picked by Tom himself. Cancel anytime.",
      priceAdjustment: { type: "fixed_amount", amount: money(2) },
    },
  ],
};

export const MOCK_PRODUCTS: Product[] = [
  makeProduct({
    id: "gid://mock/Product/1",
    handle: "midnight-jester",
    title: "Midnight Jester",
    description:
      "72% single-origin dark chocolate, roasted a little longer than anyone recommended. Bitter enough to keep you honest.",
    bg: "25382A",
    variants: [
      variant("gid://mock/ProductVariant/101", "Single Bar 85g", 8.5),
      variant("gid://mock/ProductVariant/102", "Gift Box (3 Bars)", 22),
    ],
  }),
  makeProduct({
    id: "gid://mock/Product/2",
    handle: "sea-salt-shenanigans",
    title: "Sea Salt Shenanigans",
    description:
      "Dark chocolate with flaky sea salt scattered on with more enthusiasm than precision. Sweet, salty, a little chaotic.",
    bg: "9DD4CB",
    fg: "25382A",
    variants: [
      variant("gid://mock/ProductVariant/201", "Single Bar 85g", 9, false),
      variant("gid://mock/ProductVariant/202", "Gift Box (3 Bars)", 24),
    ],
  }),
  makeProduct({
    id: "gid://mock/Product/3",
    handle: "hazelnut-hijinks",
    title: "Hazelnut Hijinks",
    description:
      "Milk chocolate loaded with toasted hazelnuts. Extremely well-behaved on the first bite, less so by the third.",
    bg: "DE5C42",
    variants: [
      variant("gid://mock/ProductVariant/301", "Single Bar 85g", 8.75),
      variant("gid://mock/ProductVariant/302", "Gift Box (3 Bars)", 23),
    ],
  }),
  makeProduct({
    id: "gid://mock/Product/4",
    handle: "chili-prankster",
    title: "Chili Prankster",
    description:
      "Dark chocolate with a chili kick that arrives fashionably late. No warning label. You'll be fine. Probably.",
    bg: "E8BC5C",
    fg: "25382A",
    variants: [variant("gid://mock/ProductVariant/401", "Single Bar 85g", 9.25)],
  }),
  makeProduct({
    id: "gid://mock/Product/5",
    handle: "golden-turmeric-truffle",
    title: "Golden Turmeric Truffle",
    description:
      "White chocolate truffles rolled in turmeric and a whisper of black pepper. Looks fancy. Is fancy. We're not sorry.",
    bg: "25382A",
    variants: [
      variant("gid://mock/ProductVariant/501", "Box of 6", 18),
      variant("gid://mock/ProductVariant/502", "Box of 12", 32),
    ],
  }),
  makeProduct({
    id: "gid://mock/Product/6",
    handle: "rosewater-rascal",
    title: "Rosewater Rascal",
    description:
      "Ruby chocolate perfumed with rosewater. Tastes like it's up to something. It is. It's delicious.",
    bg: "EFADB2",
    fg: "25382A",
    variants: [
      variant("gid://mock/ProductVariant/601", "Single Bar 85g", 9.5),
      variant("gid://mock/ProductVariant/602", "Gift Box (3 Bars)", 25),
    ],
  }),
  makeProduct({
    id: "gid://mock/Product/7",
    handle: "caramel-conspiracy",
    title: "Caramel Conspiracy",
    description:
      "Milk chocolate wrapped around a salted caramel core that leaks a little on purpose. We deny nothing.",
    bg: "E8BC5C",
    fg: "25382A",
    variants: [
      variant(
        "gid://mock/ProductVariant/701",
        "Single Bar 85g",
        9,
        true,
        SUBSCRIBE_AND_SAVE_GROUP.sellingPlans.map((p) => p.id)
      ),
      // Gift Box deliberately has an empty sellingPlanIds — demonstrates a
      // selling plan group that only targets *some* of a product's
      // variants (real Shopify behavior): switching to this variant
      // should drop back to one-time-purchase-only in the UI.
      variant("gid://mock/ProductVariant/702", "Gift Box (3 Bars)", 24),
    ],
    sellingPlanGroups: [SUBSCRIBE_AND_SAVE_GROUP],
  }),
  makeProduct({
    id: "gid://mock/Product/8",
    handle: "monthly-mischief-club",
    title: "Monthly Mischief Club",
    description:
      "A surprise bar every month, picked by Tom himself. Subscription only — some mischief can't be a one-time thing.",
    bg: "9DD4CB",
    fg: "25382A",
    variants: [
      {
        id: "gid://mock/ProductVariant/801",
        title: "Default Title",
        availableForSale: true,
        price: money(19),
        selectedOptions: [{ name: "Title", value: "Default Title" }],
        sellingPlanIds: CHOCOLATE_CLUB_GROUP.sellingPlans.map((p) => p.id),
      },
    ],
    requiresSellingPlan: true,
    sellingPlanGroups: [CHOCOLATE_CLUB_GROUP],
  }),
];

// ---------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------

export function getMockProducts(): Product[] {
  return MOCK_PRODUCTS;
}

export function getMockProduct(handle: string): Product | null {
  return MOCK_PRODUCTS.find((p) => p.handle === handle) ?? null;
}

// ---------------------------------------------------------------------
// Shop policies (/privacy, /returns, /shipping, /terms) — no mock text:
// these are legal copy a merchant writes in the Shopify admin, not
// something to invent a placeholder for. All null here means every
// policy route 404s in mock mode, same as it would for a real,
// not-yet-filled-in policy in the admin.
// ---------------------------------------------------------------------

export function getMockShopPolicies(): ShopPolicies {
  return {
    privacyPolicy: null,
    refundPolicy: null,
    shippingPolicy: null,
    termsOfService: null,
  };
}

// ---------------------------------------------------------------------
// Featured products (homepage rail) — trimmed FeaturedProduct shape, see
// types.ts. Projected from MOCK_PRODUCTS (not a separate data set) so the
// handles always resolve on /shop/[handle] — exactly how a real "Featured"
// collection in Shopify admin would just curate a subset of real products.
// ---------------------------------------------------------------------

const FEATURED_HANDLES = ["midnight-jester", "hazelnut-hijinks", "rosewater-rascal"];

export function getMockFeaturedProducts(): FeaturedProduct[] {
  return FEATURED_HANDLES.map((handle) => {
    const product = MOCK_PRODUCTS.find((p) => p.handle === handle);
    if (!product) {
      throw new Error(`getMockFeaturedProducts: "${handle}" not found in MOCK_PRODUCTS`);
    }
    return {
      id: product.id,
      handle: product.handle,
      title: product.title,
      image: product.images[0],
      price: product.priceRange.min,
    };
  });
}

// ---------------------------------------------------------------------
// Collections (/collections/[handle]) — same projection-from-
// MOCK_PRODUCTS approach as getMockFeaturedProducts above, so handles
// always resolve to real (mock) products.
// ---------------------------------------------------------------------

const MOCK_COLLECTIONS: Record<string, { title: string; description: string; handles: string[] }> = {
  gifts: {
    title: "Gifts",
    description:
      "Whether you're saying thank you, happy holidays, or just simply I'm thinking of you, these chocolates are the perfect way to say it.",
    handles: ["golden-turmeric-truffle", "rosewater-rascal", "caramel-conspiracy"],
  },
  // Dev-only fixtures exercising /collections/[handle]'s other
  // product-count layouts (featured single-product, two-card, empty) —
  // the real "Gifts" collection only ever covers the 3+ grid case.
  "single-origin": {
    title: "Single Origin",
    description: "One bar, done right — our purest single-origin dark chocolate.",
    handles: ["midnight-jester"],
  },
  truffles: {
    title: "Truffles",
    description: "Small-batch truffles, rolled by hand.",
    handles: ["golden-turmeric-truffle", "rosewater-rascal"],
  },
  seasonal: {
    title: "Seasonal",
    description: "Nothing here right now — new flavors drop soon.",
    handles: [],
  },
};

export function getMockCollection(handle: string): Collection | null {
  const collection = MOCK_COLLECTIONS[handle];
  if (!collection) return null;
  return {
    handle,
    title: collection.title,
    description: collection.description,
    products: collection.handles
      .map((h) => MOCK_PRODUCTS.find((p) => p.handle === h))
      .filter((p): p is Product => p !== undefined),
  };
}

export function getMockCollectionHandles(): string[] {
  return Object.keys(MOCK_COLLECTIONS);
}

// ---------------------------------------------------------------------
// Cart — a tiny in-memory store, good enough to demo the full flow.
// ---------------------------------------------------------------------

const mockCarts = new Map<string, Cart>();
let cartCounter = 0;
let lineCounter = 0;

function findVariant(variantId: string): { variant: ProductVariant; product: Product } | null {
  for (const product of MOCK_PRODUCTS) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { variant, product };
  }
  return null;
}

function findSellingPlan(product: Product, sellingPlanId: string): SellingPlan | null {
  for (const group of product.sellingPlanGroups) {
    const plan = group.sellingPlans.find((p) => p.id === sellingPlanId);
    if (plan) return plan;
  }
  return null;
}

function lineTotal(price: Money, quantity: number): Money {
  return { amount: (Number(price.amount) * quantity).toFixed(2), currencyCode: price.currencyCode };
}

function buildLine(merchandiseId: string, quantity: number, sellingPlanId?: string): CartLine | null {
  const found = findVariant(merchandiseId);
  if (!found) return null;
  const { variant, product } = found;
  // A real Shopify cart line's `price` already reflects any selling
  // plan discount — mirrored here so the mock cart flow (drawer, totals)
  // matches what the real Storefront API would actually return, not just
  // the plain variant price.
  const plan = sellingPlanId ? findSellingPlan(product, sellingPlanId) : null;
  const price = plan ? applySellingPlanAdjustment(variant.price, plan.priceAdjustment) : variant.price;
  return {
    id: `mock-line-${++lineCounter}`,
    quantity,
    merchandiseId: variant.id,
    variantTitle: variant.title,
    price,
    lineTotal: lineTotal(price, quantity),
    product: {
      title: product.title,
      handle: product.handle,
      image: product.images[0] ?? null,
    },
    sellingPlanName: plan?.name ?? null,
  };
}

function recomputeTotals(cart: Cart): Cart {
  const totalQuantity = cart.lines.reduce((sum, l) => sum + l.quantity, 0);
  const amount = cart.lines.reduce((sum, l) => sum + Number(l.lineTotal.amount), 0);
  const currencyCode = cart.lines[0]?.price.currencyCode ?? cart.subtotal.currencyCode;
  return { ...cart, totalQuantity, subtotal: { amount: amount.toFixed(2), currencyCode } };
}

export function getMockCart(cartId: string): Cart | null {
  return mockCarts.get(cartId) ?? null;
}

export function createMockCart(lines: CartLineInput[] = []): Cart {
  const id = `mock-cart-${++cartCounter}`;
  const builtLines = lines
    .map((l) => buildLine(l.merchandiseId, l.quantity, l.sellingPlanId))
    .filter((l): l is CartLine => l !== null);

  const cart = recomputeTotals({
    id,
    checkoutUrl: `/shop/mock-checkout?cart=${id}`,
    totalQuantity: 0,
    subtotal: { amount: "0.00", currencyCode: "USD" },
    lines: builtLines,
  });
  mockCarts.set(id, cart);
  return cart;
}

export function addMockLines(cartId: string, lines: CartLineInput[]): Cart {
  const cart = mockCarts.get(cartId);
  if (!cart) return createMockCart(lines);

  const nextLines = [...cart.lines];
  for (const { merchandiseId, quantity, sellingPlanId } of lines) {
    const found = findVariant(merchandiseId);
    const plan = sellingPlanId && found ? findSellingPlan(found.product, sellingPlanId) : null;
    // Same variant on a different selling plan (or one-time vs. any
    // plan) is a distinct line — matches CartProvider's optimistic
    // reducer and real Shopify cart behavior, see that file's comment.
    const existing = nextLines.find(
      (l) => l.merchandiseId === merchandiseId && l.sellingPlanName === (plan?.name ?? null)
    );
    if (existing) {
      existing.quantity += quantity;
      existing.lineTotal = lineTotal(existing.price, existing.quantity);
    } else {
      const built = buildLine(merchandiseId, quantity, sellingPlanId);
      if (built) nextLines.push(built);
    }
  }

  const updated = recomputeTotals({ ...cart, lines: nextLines });
  mockCarts.set(cartId, updated);
  return updated;
}

export function updateMockLine(cartId: string, lineId: string, quantity: number): Cart {
  const cart = mockCarts.get(cartId);
  if (!cart) throw new Error(`Mock cart ${cartId} not found`);

  const nextLines = cart.lines
    .map((l) => (l.id === lineId ? { ...l, quantity, lineTotal: lineTotal(l.price, quantity) } : l))
    .filter((l) => l.quantity > 0);

  const updated = recomputeTotals({ ...cart, lines: nextLines });
  mockCarts.set(cartId, updated);
  return updated;
}

export function removeMockLine(cartId: string, lineId: string): Cart {
  const cart = mockCarts.get(cartId);
  if (!cart) throw new Error(`Mock cart ${cartId} not found`);

  const updated = recomputeTotals({ ...cart, lines: cart.lines.filter((l) => l.id !== lineId) });
  mockCarts.set(cartId, updated);
  return updated;
}
