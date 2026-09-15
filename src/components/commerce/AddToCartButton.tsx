"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useCart } from "./CartProvider";
import type { Product, ProductVariant } from "@/lib/shopify/types";

export interface AddToCartButtonProps {
  product: Pick<Product, "title" | "handle" | "images">;
  variant: ProductVariant | null;
  quantity?: number;
  className?: string;
}

/** Builds on ui/Button. Optimistic add (see CartProvider) plus a brief,
 * motion-safe "Added!" state — the label swaps instantly either way; the
 * squash is decorative flourish only under motion-safe. */
export function AddToCartButton({
  product,
  variant,
  quantity = 1,
  className = "",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const disabled = !variant || !variant.availableForSale;

  async function handleClick() {
    if (!variant) return;
    setError(null);
    // addItem never throws — it always resolves to a CartResult, even when
    // the mutation failed server-side (see shopify/actions.ts), so a real
    // failure (e.g. Shopify's "Variant can only be purchased with a
    // selling plan.") shows here instead of blanking the page.
    const result = await addItem(variant, product, quantity);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setJustAdded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setJustAdded(false), 1400);
  }

  const squashClass = justAdded ? "motion-safe:scale-y-90" : "motion-safe:scale-y-100";
  const label = !variant || !variant.availableForSale
    ? "Sold Out"
    : justAdded
      ? "Added!"
      : "Add to Cart";

  return (
    // `inline-flex`, not `flex`: this wrapper replaces what used to be the
    // `<button>` itself as call sites' sizing target (ProductDetail passes
    // `w-full sm:w-auto`, expecting shrink-to-fit at `sm:` and up). A
    // `<button>` is inline-level by default, so that worked before this
    // wrapper existed; a block-level `flex` container fills its parent's
    // width even with `width:auto` (block boxes don't shrink-to-fit) —
    // confirmed by measurement, this silently stretched the PDP's desktop
    // Add to Cart button to the full details-column width. `inline-flex`
    // restores the original shrink-to-fit behavior while keeping the
    // internal button+error column layout unchanged.
    <div className={`inline-flex flex-col gap-fluid-xs ${className}`}>
      <Button
        type="button"
        variant="primary"
        disabled={disabled}
        onClick={handleClick}
        className={`w-full transition-transform duration-150 ${squashClass}`}
      >
        {label}
      </Button>
      {error ? (
        <p role="alert" className="font-sans text-sm text-tf-cinnamon-strong">
          {error}
        </p>
      ) : null}
    </div>
  );
}
