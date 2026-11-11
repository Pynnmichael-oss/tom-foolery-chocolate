"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { EyesHatIcon } from "@/components/ui/logos";
import { isGiftComponentLine, useCart } from "./CartProvider";
import { formatMoney } from "@/lib/shopify/format";
import { compareSetLabels, groupBySet, labelOf, parseGiftNote } from "@/lib/gift-builder/gift-notes";
import { shortFlavorName } from "@/lib/gift-builder/cart-line";
import { isPackagingComponent } from "@/lib/gift-builder/sets";
import type { CartLine } from "@/lib/shopify/types";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { trackBeginCheckout, trackViewCart } from "@/lib/analytics/ga";

/** Right-side slide-in cart drawer. Focus-trapped while open (see
 * useFocusTrap — also used by MobileNav), closes on ESC or overlay click,
 * restores focus to whatever opened it. The slide is a CSS transition
 * disabled entirely under reduced motion (instant show/hide instead), so
 * no JS branching is needed for that part. */
export function CartDrawer() {
  const {
    cart,
    isDrawerOpen,
    closeDrawer,
    updateItem,
    removeItem,
    removeGiftSet,
    syncBeforeCheckout,
    isPending,
  } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // Line-level mutations (quantity +/-, remove) never throw — see
  // shopify/actions.ts — but can still fail (e.g. Shopify reports a line
  // as out of stock mid-session); surfaced here as a small banner rather
  // than silently leaving the drawer showing stale-looking quantities.
  const [error, setError] = useState<string | null>(null);
  // Tracks the drawer's previous open state so view_cart fires exactly
  // once per closed→open transition — not on every cart line mutation
  // made while it's already open (quantity +/-, remove).
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isDrawerOpen && !wasOpenRef.current && cart) {
      trackViewCart(cart);
    }
    wasOpenRef.current = isDrawerOpen;
  }, [isDrawerOpen, cart]);

  useFocusTrap({
    isOpen: isDrawerOpen,
    onClose: closeDrawer,
    panelRef,
    initialFocusRef: closeButtonRef,
  });

  async function handleUpdate(lineId: string, quantity: number) {
    setError(null);
    const result = await updateItem(lineId, quantity);
    if (!result.success) setError(result.error);
  }

  async function handleRemove(lineId: string) {
    setError(null);
    const result = await removeItem(lineId);
    if (!result.success) setError(result.error);
  }

  async function handleRemoveSet(setLabel: string) {
    setError(null);
    const result = await removeGiftSet(setLabel);
    if (!result.success) setError(result.error);
  }

  const lines = cart?.lines ?? [];
  // Gift sets (lib/gift-builder) are several lines sharing a "Set" label —
  // shown as one card each. Ordinary lines come under the `null` key.
  // Sets in A → B → C order (Shopify keeps newest first), then ordinary
  // lines — the same order checkout and the packing slip use.
  const groups = [...groupBySet(lines).entries()].sort(([a], [b]) =>
    a === null ? (b === null ? 0 : 1) : b === null ? -1 : compareSetLabels(a, b)
  );
  const giftMessages = parseGiftNote(cart?.note).messages;

  return (
    // id: a stable hook for MobileNav to make this inert while the
    // full-screen mobile menu is open (see that component's own comment).
    <div id="cart-drawer-root" className="fixed inset-0 z-[60]" inert={!isDrawerOpen}>
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
          {error ? (
            <p role="alert" className="mb-fluid-sm font-sans text-sm text-tf-cinnamon">
              {error}
            </p>
          ) : null}
          {lines.length === 0 ? (
            <p className="font-sans text-tf-white/60">Your cart is empty.</p>
          ) : (
            <ul className="flex flex-col gap-fluid-md">
              {groups.flatMap(([setLabel, groupLines]) =>
                setLabel === null
                  ? groupLines.map((line) => (
                      <ProductLineItem
                        key={line.id}
                        line={line}
                        disabled={isPending}
                        onUpdate={handleUpdate}
                        onRemove={handleRemove}
                      />
                    ))
                  : [
                      <GiftSetLineItem
                        key={`set-${setLabel}`}
                        lines={groupLines}
                        message={giftMessages.get(setLabel) ?? null}
                        disabled={isPending}
                        onRemove={() => handleRemoveSet(setLabel)}
                      />,
                    ]
              )}
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
            <a
              href={cart.checkoutUrl}
              onClick={async (e) => {
                trackBeginCheckout(cart);
                // Gift sets: put their lines in A → B → C order and re-sync
                // the gift messages, then continue to checkout.
                if (!cart.lines.some((l) => labelOf(l) !== null)) return;
                e.preventDefault();
                const url = cart.checkoutUrl;
                await syncBeforeCheckout().catch(() => {});
                window.location.href = url;
              }}
              className={buttonClasses("primary", "w-full")}
            >
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

const REMOVE_CLASS =
  "font-sans text-sm text-tf-white/60 underline-offset-2 hover:text-tf-cinnamon hover:underline disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-turmeric";

function LineImage({ line }: { line: CartLine }) {
  return (
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
  );
}

/** An ordinary product line: title, variant, price, quantity stepper. */
function ProductLineItem({
  line,
  disabled,
  onUpdate,
  onRemove,
}: {
  line: CartLine;
  disabled: boolean;
  onUpdate: (lineId: string, quantity: number) => void;
  onRemove: (lineId: string) => void;
}) {
  return (
    <li className="flex gap-fluid-sm">
      <LineImage line={line} />

      <div className="flex flex-1 flex-col gap-1">
        <p className="font-display text-base leading-tight">{line.product.title}</p>
        <p className="font-sans text-sm text-tf-white/60">{line.variantTitle}</p>
        {line.sellingPlanName ? (
          // tf-turmeric, not the muted white/60 variantTitle uses — this is
          // the one thing on the line that isn't just "which variant," it's
          // "how it's being purchased," worth its own accent color to stand
          // out at a glance in a cart with mixed one-time and subscription
          // lines.
          <p className="font-sans text-sm font-semibold text-tf-turmeric">{line.sellingPlanName}</p>
        ) : null}
        <p className="font-sans text-sm">{formatMoney(line.price)}</p>

        <div className="mt-1 flex items-center gap-fluid-sm">
          <div className="flex items-center gap-2 rounded-full border border-tf-white/20">
            <button
              type="button"
              disabled={disabled}
              aria-label={`Decrease quantity of ${line.product.title}`}
              onClick={() => onUpdate(line.id, line.quantity - 1)}
              className="px-2 py-1 font-sans disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-turmeric"
            >
              −
            </button>
            <span className="min-w-[1.5ch] text-center font-sans text-sm">{line.quantity}</span>
            <button
              type="button"
              disabled={disabled}
              aria-label={`Increase quantity of ${line.product.title}`}
              onClick={() => onUpdate(line.id, line.quantity + 1)}
              className="px-2 py-1 font-sans disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-turmeric"
            >
              +
            </button>
          </div>

          <button type="button" disabled={disabled} onClick={() => onRemove(line.id)} className={REMOVE_CLASS}>
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

/**
 * One gift set = one card: the set line's title, size/wrap and price, its
 * band, the $0 component lines listed as contents, and its gift message.
 * One Remove for the whole set (all lines + its note entry). No quantity
 * stepper — each set has its own label and message, so a second one is
 * built again. The "Set" letter is for packers and isn't shown.
 */
function GiftSetLineItem({
  lines,
  message,
  disabled,
  onRemove,
}: {
  lines: CartLine[];
  message: string | null;
  disabled: boolean;
  onRemove: () => void;
}) {
  const parent = lines.find((l) => !isGiftComponentLine(l)) ?? lines[0];
  // Band and wrap lines are on the order for the packing slip; here the
  // band shows from the set line and the wrap is in its variant title.
  const contents = lines.filter((l) => l !== parent && !isPackagingComponent(l.product.handle));
  const band = parent.attributes.find((a) => a.key === "Band")?.value;

  return (
    <li className="flex gap-fluid-sm">
      <LineImage line={parent} />

      <div className="flex flex-1 flex-col gap-1">
        <p className="font-display text-base leading-tight">{parent.product.title}</p>
        <p className="font-sans text-sm text-tf-white/60">{parent.variantTitle}</p>
        <dl className="flex flex-col gap-0.5 font-sans text-xs text-tf-white/70">
          {contents.length > 0 ? (
            <div className="flex gap-1">
              <dt className="shrink-0 font-semibold text-tf-white/90">Inside:</dt>
              <dd>
                {contents
                  .map((c) => {
                    const name = shortFlavorName(c.product.title);
                    const variant = c.variantTitle && c.variantTitle !== "Default Title" ? ` (${c.variantTitle})` : "";
                    return `${c.quantity} × ${name}${variant}`;
                  })
                  .join(", ")}
              </dd>
            </div>
          ) : null}
          {band ? (
            <div className="flex gap-1">
              <dt className="shrink-0 font-semibold text-tf-white/90">Band:</dt>
              <dd>{band}</dd>
            </div>
          ) : null}
          {message ? (
            <div className="flex gap-1">
              <dt className="shrink-0 font-semibold text-tf-white/90">Card:</dt>
              <dd className="break-words">&ldquo;{message}&rdquo;</dd>
            </div>
          ) : null}
        </dl>
        <p className="font-sans text-sm">{formatMoney(parent.price)}</p>

        <div className="mt-1">
          <button type="button" disabled={disabled} onClick={onRemove} className={REMOVE_CLASS}>
            Remove set
          </button>
        </div>
      </div>
    </li>
  );
}
