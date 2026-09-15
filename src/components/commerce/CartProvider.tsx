"use client";

import {
  createContext,
  useContext,
  useEffect,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import type { ReactNode } from "react";
import {
  addToCartAction,
  getCartAction,
  removeCartLineAction,
  updateCartLineAction,
} from "@/lib/shopify/actions";
import type { Cart, CartLine, CartResult, Product, ProductVariant } from "@/lib/shopify/types";

const CART_COOKIE = "tf_cart_id";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function readCartIdCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CART_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCartIdCookie(id: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${CART_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${CART_COOKIE_MAX_AGE}; samesite=lax`;
}

function clearCartIdCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${CART_COOKIE}=; path=/; max-age=0`;
}

/* ------------------------------------------------------------------ */
/* Optimistic reducer                                                   */
/* ------------------------------------------------------------------ */

type OptimisticAction =
  | {
      type: "add";
      variant: ProductVariant;
      product: Pick<Product, "title" | "handle" | "images">;
      quantity: number;
    }
  | { type: "update"; lineId: string; quantity: number }
  | { type: "remove"; lineId: string };

function recomputeTotals(cart: Cart): Cart {
  const totalQuantity = cart.lines.reduce((sum, l) => sum + l.quantity, 0);
  const amount = cart.lines.reduce((sum, l) => sum + Number(l.lineTotal.amount), 0);
  const currencyCode = cart.lines[0]?.price.currencyCode ?? cart.subtotal.currencyCode;
  return { ...cart, totalQuantity, subtotal: { amount: amount.toFixed(2), currencyCode } };
}

function cartReducer(cart: Cart | null, action: OptimisticAction): Cart | null {
  switch (action.type) {
    case "add": {
      const base: Cart = cart ?? {
        id: "",
        checkoutUrl: "",
        totalQuantity: 0,
        subtotal: { amount: "0", currencyCode: action.variant.price.currencyCode },
        lines: [],
      };
      const existing = base.lines.find((l) => l.merchandiseId === action.variant.id);
      const lines: CartLine[] = existing
        ? base.lines.map((l) =>
            l.merchandiseId === action.variant.id
              ? {
                  ...l,
                  quantity: l.quantity + action.quantity,
                  lineTotal: {
                    amount: (Number(l.price.amount) * (l.quantity + action.quantity)).toFixed(2),
                    currencyCode: l.price.currencyCode,
                  },
                }
              : l
          )
        : [
            ...base.lines,
            {
              id: `optimistic-${action.variant.id}`,
              quantity: action.quantity,
              merchandiseId: action.variant.id,
              variantTitle: action.variant.title,
              price: action.variant.price,
              lineTotal: {
                amount: (Number(action.variant.price.amount) * action.quantity).toFixed(2),
                currencyCode: action.variant.price.currencyCode,
              },
              product: {
                title: action.product.title,
                handle: action.product.handle,
                image: action.product.images[0] ?? null,
              },
            },
          ];
      return recomputeTotals({ ...base, lines });
    }

    case "update": {
      if (!cart) return cart;
      const lines = cart.lines.map((l) =>
        l.id === action.lineId
          ? {
              ...l,
              quantity: action.quantity,
              lineTotal: {
                amount: (Number(l.price.amount) * action.quantity).toFixed(2),
                currencyCode: l.price.currencyCode,
              },
            }
          : l
      );
      return recomputeTotals({ ...cart, lines });
    }

    case "remove": {
      if (!cart) return cart;
      return recomputeTotals({ ...cart, lines: cart.lines.filter((l) => l.id !== action.lineId) });
    }

    default:
      return cart;
  }
}

/* ------------------------------------------------------------------ */
/* Context                                                              */
/* ------------------------------------------------------------------ */

interface CartContextValue {
  cart: Cart | null;
  isPending: boolean;
  itemCount: number;
  checkoutUrl: string | null;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (
    variant: ProductVariant,
    product: Pick<Product, "title" | "handle" | "images">,
    quantity?: number
  ) => Promise<CartResult>;
  updateItem: (lineId: string, quantity: number) => Promise<CartResult>;
  removeItem: (lineId: string) => Promise<CartResult>;
}

/** Guard-clause fallback for `updateItem`/`removeItem` called with no cart
 * loaded yet — practically unreachable through the UI (those controls only
 * render for an existing line), kept just so the return type stays a real
 * `CartResult` everywhere rather than `void`/`undefined` in an edge case. */
const CART_OUT_OF_SYNC: CartResult = {
  success: false,
  error: "Your cart is out of sync — refresh and try again.",
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticCart, applyOptimistic] = useOptimistic(cart, cartReducer);

  // Hydrate from a previous session's cart cookie, if any.
  useEffect(() => {
    const existingId = readCartIdCookie();
    if (!existingId) return;
    getCartAction(existingId).then((found) => {
      if (found) {
        setCart(found);
      } else {
        clearCartIdCookie();
      }
    });
  }, []);

  function addItem(
    variant: ProductVariant,
    product: Pick<Product, "title" | "handle" | "images">,
    quantity = 1
  ): Promise<CartResult> {
    let settle!: (result: CartResult) => void;
    const promise = new Promise<CartResult>((resolve) => {
      settle = resolve;
    });

    startTransition(async () => {
      applyOptimistic({ type: "add", variant, product, quantity });
      const result = await addToCartAction(cart?.id || readCartIdCookie(), variant.id, quantity);
      if (result.success) {
        writeCartIdCookie(result.cart.id);
        setCart(result.cart);
        setDrawerOpen(true);
      }
      // On failure, deliberately not calling setCart: the optimistic line
      // added above reverts on its own once this transition settles,
      // since useOptimistic always falls back to the last real `cart`
      // state — no separate rollback action needed.
      settle(result);
    });

    return promise;
  }

  function updateItem(lineId: string, quantity: number): Promise<CartResult> {
    if (quantity <= 0) return removeItem(lineId);
    if (!cart) return Promise.resolve(CART_OUT_OF_SYNC);

    const cartId = cart.id;
    let settle!: (result: CartResult) => void;
    const promise = new Promise<CartResult>((resolve) => {
      settle = resolve;
    });

    startTransition(async () => {
      applyOptimistic({ type: "update", lineId, quantity });
      const result = await updateCartLineAction(cartId, lineId, quantity);
      if (result.success) setCart(result.cart);
      settle(result);
    });

    return promise;
  }

  function removeItem(lineId: string): Promise<CartResult> {
    if (!cart) return Promise.resolve(CART_OUT_OF_SYNC);

    const cartId = cart.id;
    let settle!: (result: CartResult) => void;
    const promise = new Promise<CartResult>((resolve) => {
      settle = resolve;
    });

    startTransition(async () => {
      applyOptimistic({ type: "remove", lineId });
      const result = await removeCartLineAction(cartId, lineId);
      if (result.success) setCart(result.cart);
      settle(result);
    });

    return promise;
  }

  const value: CartContextValue = {
    cart: optimisticCart,
    isPending,
    itemCount: optimisticCart?.totalQuantity ?? 0,
    checkoutUrl: optimisticCart?.checkoutUrl || null,
    isDrawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    addItem,
    updateItem,
    removeItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
