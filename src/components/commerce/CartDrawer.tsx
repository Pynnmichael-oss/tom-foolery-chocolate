"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { EyesHatIcon } from "@/components/ui/logos";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/shopify/format";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Right-side slide-in cart drawer. Focus-trapped while open, closes on
 * ESC or overlay click, restores focus to whatever opened it. The slide is
 * a CSS transition disabled entirely under reduced motion (instant show/hide
 * instead), so no JS branching is needed for that part. */
export function CartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, updateItem, removeItem, isPending } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Move focus into the drawer on open, restore it on close.
  useEffect(() => {
    if (isDrawerOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      closeButtonRef.current?.focus();
    } else {
      previouslyFocusedRef.current?.focus?.();
    }
  }, [isDrawerOpen]);

  // ESC to close + Tab focus trap.
  useEffect(() => {
    if (!isDrawerOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDrawer();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  const lines = cart?.lines ?? [];

  return (
    <div className="fixed inset-0 z-[60]" inert={!isDrawerOpen}>
      {/* Overlay */}
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        className={`absolute inset-0 bg-tf-black/50 transition-opacity duration-300 motion-reduce:transition-none ${
          isDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-tf-black text-tf-white shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          isDrawerOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-tf-white/10 px-fluid-md py-fluid-sm">
          <EyesHatIcon tone="negative" width={32} title="Tom Foolery" />

          <p className="font-display text-xl">Your Cart</p>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeDrawer}
            aria-label="Close cart"
            className="rounded-full p-2 text-tf-white transition-colors hover:text-tf-turmeric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-turmeric"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-fluid-md py-fluid-md">
          {lines.length === 0 ? (
            <p className="font-sans text-tf-white/60">Your cart is empty.</p>
          ) : (
            <ul className="flex flex-col gap-fluid-md">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-fluid-sm">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-tf-white/10">
                    {line.product.image ? (
                      <Image
                        src={line.product.image.url}
                        alt={line.product.image.altText ?? line.product.title}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <p className="font-display text-base leading-tight">{line.product.title}</p>
                    <p className="font-sans text-sm text-tf-white/60">{line.variantTitle}</p>
                    <p className="font-sans text-sm">{formatMoney(line.price)}</p>

                    <div className="mt-1 flex items-center gap-fluid-sm">
                      <div className="flex items-center gap-2 rounded-full border border-tf-white/20">
                        <button
                          type="button"
                          disabled={isPending}
                          aria-label={`Decrease quantity of ${line.product.title}`}
                          onClick={() => updateItem(line.id, line.quantity - 1)}
                          className="px-2 py-1 font-sans disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-turmeric"
                        >
                          −
                        </button>
                        <span className="min-w-[1.5ch] text-center font-sans text-sm">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isPending}
                          aria-label={`Increase quantity of ${line.product.title}`}
                          onClick={() => updateItem(line.id, line.quantity + 1)}
                          className="px-2 py-1 font-sans disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-turmeric"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => removeItem(line.id)}
                        className="font-sans text-sm text-tf-white/60 underline-offset-2 hover:text-tf-cinnamon hover:underline disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-turmeric"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-tf-white/10 px-fluid-md py-fluid-md">
          <div className="mb-fluid-sm flex items-center justify-between font-sans">
            <span className="text-tf-white/70">Subtotal</span>
            <span className="font-black">
              {formatMoney(cart?.subtotal ?? { amount: "0", currencyCode: "USD" })}
            </span>
          </div>

          {cart?.checkoutUrl && lines.length > 0 ? (
            <a href={cart.checkoutUrl} className={buttonClasses("primary", "w-full")}>
              Checkout
            </a>
          ) : (
            <Button variant="primary" className="w-full" disabled>
              Checkout
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
