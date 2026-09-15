"use server";

/**
 * Server Actions wrapping queries.ts's cart operations. This is the only
 * bridge CartProvider (a client component) has to Shopify — the storefront
 * token in client.ts is a server-only env var, so all cart mutations must
 * run here, not in the browser.
 *
 * Every cart mutation below catches its own failures and returns a
 * `CartResult` instead of throwing. A Server Action that throws reaches the
 * client as an opaque "Minified React error #441" (React strips the real
 * message in production) and blanks the whole page via the nearest error
 * boundary — that's exactly what used to happen here whenever Shopify
 * returned a `userErrors` entry (e.g. a variant requiring a selling plan)
 * or any other mutation failure, since `queries.ts`'s `createCart`/
 * `addLines`/etc. deliberately throw (`ShopifyApiError`) rather than
 * swallow errors themselves. Catching at this boundary — the last point
 * before the client — means every caller (CartProvider) always gets a
 * value to branch on and show a real message from.
 */
import { ShopifyApiError } from "./client";
import { addLines, createCart, createCustomer, getCart, removeLine, updateLine } from "./queries";
import type { Cart, CartResult, SubscribeResult } from "./types";

const GENERIC_CART_ERROR = "We couldn't update your cart. Please try again in a moment.";

function toCartError(error: unknown, context: string): string {
  console.error(`[cart] ${context}:`, error);
  // ShopifyApiError.userMessage is only ever set from Shopify's own
  // userErrors copy (see assertNoUserErrors in queries.ts) — already
  // written to be customer-facing. Anything else (bad token, network
  // failure, malformed response) falls back to a generic message instead
  // of leaking internals.
  return error instanceof ShopifyApiError && error.userMessage ? error.userMessage : GENERIC_CART_ERROR;
}

export async function getCartAction(cartId: string): Promise<Cart | null> {
  return getCart(cartId);
}

export async function addToCartAction(
  cartId: string | null,
  merchandiseId: string,
  quantity: number
): Promise<CartResult> {
  try {
    if (!cartId) {
      return { success: true, cart: await createCart([{ merchandiseId, quantity }]) };
    }
    try {
      return { success: true, cart: await addLines(cartId, [{ merchandiseId, quantity }]) };
    } catch (error) {
      // Cart may have expired or been completed at checkout — start fresh
      // before giving up. A genuine per-item failure (out of stock, a
      // variant requiring a selling plan, etc.) will fail createCart the
      // same way, and the outer catch below reports that once.
      console.error("[cart] addLines failed, starting a new cart:", error);
      return { success: true, cart: await createCart([{ merchandiseId, quantity }]) };
    }
  } catch (error) {
    return { success: false, error: toCartError(error, "addToCartAction failed") };
  }
}

export async function updateCartLineAction(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<CartResult> {
  try {
    return { success: true, cart: await updateLine(cartId, lineId, quantity) };
  } catch (error) {
    return { success: false, error: toCartError(error, "updateCartLineAction failed") };
  }
}

export async function removeCartLineAction(cartId: string, lineId: string): Promise<CartResult> {
  try {
    return { success: true, cart: await removeLine(cartId, lineId) };
  } catch (error) {
    return { success: false, error: toCartError(error, "removeCartLineAction failed") };
  }
}

/** Used by EmailSignupPopup — the only client this action has, so the
 * storefront token stays server-side same as every cart mutation above. */
export async function subscribeCustomerAction(email: string): Promise<SubscribeResult> {
  const trimmed = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { success: false, error: "Enter a valid email address." };
  }
  return createCustomer(trimmed);
}
