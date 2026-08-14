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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const disabled = !variant || !variant.availableForSale;

  function handleClick() {
    if (!variant) return;
    addItem(variant, product, quantity);
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
    <Button
      type="button"
      variant="primary"
      disabled={disabled}
      onClick={handleClick}
      className={`transition-transform duration-150 ${squashClass} ${className}`}
    >
      {label}
    </Button>
  );
}
