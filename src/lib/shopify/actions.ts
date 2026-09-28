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
import { addLines, createCart, getCart, removeLine, updateLine } from "./queries";
import type { Cart, CartResult } from "./types";

const GENERIC_CART_ERROR = "We couldn't update your cart. Please try again in a moment.";

/**
 * Shopify's own userErrors copy (`ShopifyApiError.userMessage`, set from
 * `assertNoUserErrors` in queries.ts) is technically "safe to show a
 * customer" — but it reads like an API error, not this brand
 * ("Variant can only be purchased with a selling plan."), so it's mapped
 * to friendly copy here instead of shown as-is. The raw message is never
 * lost — `toCartError` below logs the full error (Shopify's exact text
 * included) before this runs, so it's still one console.error away for
 * debugging.
 *
 * Scoped to what a selling-plan-aware cart can actually trigger; ProductDetail.tsx's
 * own UI (preselecting a required plan, only ever sending a
 * `sellingPlanId` the selected variant actually supports) already
 * prevents most of these in normal use — this is the defense-in-depth
 * layer for whatever gets through anyway (a stale page, a plan that was
 * deleted in Shopify admin between page load and add-to-cart, etc.).
 * Anything unrecognized (out of stock, currency mismatches, and every
 * other userError type this app doesn't specifically target) falls
 * through to GENERIC_CART_ERROR, same as before this mapping existed.
 */
function mapUserErrorMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (!lower.includes("selling plan")) return GENERIC_CART_ERROR;

  if (lower.includes("can only be purchased")) {
    return "This item is subscription-only — please choose a purchase plan before adding it to your cart.";
  }
  if (lower.includes("does not exist") || lower.includes("not found") || lower.includes("invalid")) {
    return "That subscription option isn't available anymore — please choose another and try again.";
  }
  // Some other selling-plan-shaped userError we haven't specifically
  // mapped — still worth a subscription-flavored message over the plain
  // cart one, since we know that much about it.
  return "We couldn't apply that subscription option. Please try again or choose a different plan.";
}

function toCartError(error: unknown, context: string): string {
  // Full error object, Shopify's exact userErrors text included — see
  // mapUserErrorMessage's own comment for why the customer-facing
  // message below is never this raw text directly.
  console.error(`[cart] ${context}:`, error);
  if (error instanceof ShopifyApiError && error.userMessage) {
    return mapUserErrorMessage(error.userMessage);
  }
  // Anything else (bad token, network failure, malformed response) has
  // no customer-safe text to work with at all.
  return GENERIC_CART_ERROR;
}

export async function getCartAction(cartId: string): Promise<Cart | null> {
  return getCart(cartId);
}

export async function addToCartAction(
  cartId: string | null,
  merchandiseId: string,
  quantity: number,
  sellingPlanId?: string
): Promise<CartResult> {
  try {
    if (!cartId) {
      return { success: true, cart: await createCart([{ merchandiseId, quantity, sellingPlanId }]) };
    }
    try {
      return {
        success: true,
        cart: await addLines(cartId, [{ merchandiseId, quantity, sellingPlanId }]),
      };
    } catch (error) {
      // Cart may have expired or been completed at checkout — start fresh
      // before giving up. A genuine per-item failure (out of stock, a
      // variant requiring a selling plan, etc.) will fail createCart the
      // same way, and the outer catch below reports that once.
      console.error("[cart] addLines failed, starting a new cart:", error);
      return { success: true, cart: await createCart([{ merchandiseId, quantity, sellingPlanId }]) };
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
