/**
 * In-memory fallback "backend" used whenever isShopifyConfigured() is
 * false (see client.ts) — no Shopify credentials required to build, run,
 * or click through the whole commerce flow, cart included. Data shapes
 * match the normalized types in types.ts exactly, so nothing downstream
 * needs to know mock data is in play.
 */
import type { Cart, CartLine, CartLineInput, Money, Product, ProductVariant } from "./types";

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
  availableForSale = true
): ProductVariant {
  return {
    id,
    title: size,
    availableForSale,
    price: money(price),
    selectedOptions: [{ name: "Size", value: size }],
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
  };
}

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

function lineTotal(price: Money, quantity: number): Money {
  return { amount: (Number(price.amount) * quantity).toFixed(2), currencyCode: price.currencyCode };
}

function buildLine(merchandiseId: string, quantity: number): CartLine | null {
  const found = findVariant(merchandiseId);
  if (!found) return null;
  const { variant, product } = found;
  return {
    id: `mock-line-${++lineCounter}`,
    quantity,
    merchandiseId: variant.id,
    variantTitle: variant.title,
    price: variant.price,
    lineTotal: lineTotal(variant.price, quantity),
    product: {
      title: product.title,
      handle: product.handle,
      image: product.images[0] ?? null,
    },
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
    .map((l) => buildLine(l.merchandiseId, l.quantity))
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
  for (const { merchandiseId, quantity } of lines) {
    const existing = nextLines.find((l) => l.merchandiseId === merchandiseId);
    if (existing) {
      existing.quantity += quantity;
      existing.lineTotal = lineTotal(existing.price, existing.quantity);
    } else {
      const built = buildLine(merchandiseId, quantity);
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
