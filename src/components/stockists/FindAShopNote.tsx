import Link from "next/link";

/**
 * One quiet line pointing at the store locator, for the places someone
 * is deciding whether to order online (/shop, a product page). Kept
 * deliberately low-key — secondary to Add to Cart, never a button — so
 * it catches the shopper who'd rather not pay shipping without pulling
 * anyone else away from checkout. /find-us is intentionally NOT in the
 * top nav for the same reason; see Footer and MobileNav for its other
 * entry points.
 */
export function FindAShopNote({ className = "" }: { className?: string }) {
  return (
    <p className={`font-sans text-sm text-fg/70 ${className}`}>
      Rather pick some up in person?{" "}
      <Link
        href="/find-us"
        className="font-black text-fg underline decoration-tf-cinnamon decoration-2 underline-offset-4 hover:text-tf-cinnamon-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon"
      >
        Find a shop near you
      </Link>
      .
    </p>
  );
}
