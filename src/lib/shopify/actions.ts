"use server";

/**
 * Server Actions wrapping queries.ts's cart operations. This is the only
 * bridge CartProvider (a client component) has to Shopify — the storefront
 * token in client.ts is a server-only env var, so all cart mutations must
 * run here, not in the browser.
 */
import { addLines, createCart, createCustomer, getCart, removeLine, updateLine } from "./queries";
import type { Cart, SubscribeResult } from "./types";

export async function getCartAction(cartId: string): Promise<Cart | null> {
  return getCart(cartId);
}

export async function addToCartAction(
  cartId: string | null,
  merchandiseId: string,
  quantity: number
): Promise<Cart> {
  if (!cartId) {
    return createCart([{ merchandiseId, quantity }]);
  }
  try {
    return await addLines(cartId, [{ merchandiseId, quantity }]);
  } catch (error) {
    // Cart may have expired or been completed at checkout — start fresh.
    console.error("[cart] addLines failed, starting a new cart:", error);
    return createCart([{ merchandiseId, quantity }]);
  }
}

export async function updateCartLineAction(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<Cart> {
  return updateLine(cartId, lineId, quantity);
}

export async function removeCartLineAction(cartId: string, lineId: string): Promise<Cart> {
  return removeLine(cartId, lineId);
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
