"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/commerce/CartProvider";

/**
 * Sticky nav. Deliberately doesn't try to adapt its color to whatever
 * section is scrolling underneath — a solid-ish light backdrop guarantees
 * legibility over every brand color (juniper, rose, turmeric, black) without
 * scroll-linked color logic.
 */
export function Nav() {
  const { itemCount, openDrawer } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-tf-black/10 bg-tf-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-fluid-md px-fluid-md py-fluid-sm">
        <Link
          href="/"
          aria-label="Tom Foolery Chocolate — home"
          className="flex min-w-[90px] items-center"
        >
          {/* Horizontal signature logo placeholder */}
          <svg
            viewBox="0 0 160 32"
            role="img"
            aria-hidden="true"
            className="h-6 w-auto text-tf-black sm:h-7"
          >
            <text
              x="0"
              y="24"
              fontFamily="var(--font-feature-deck), Georgia, serif"
              fontSize="26"
              fill="currentColor"
            >
              Tom Foolery
            </text>
          </svg>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-fluid-lg sm:flex">
          <a
            href="#story"
            className="font-sofia text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em] text-tf-black transition-colors hover:text-tf-cinnamon"
          >
            Story
          </a>
          <Link
            href="/shop"
            className="font-sofia text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em] text-tf-black transition-colors hover:text-tf-cinnamon"
          >
            Shop
          </Link>
        </nav>

        <Button
          variant="primary"
          className="relative shrink-0"
          onClick={openDrawer}
          aria-label={`Open cart${itemCount > 0 ? ` (${itemCount} item${itemCount === 1 ? "" : "s"})` : ""}`}
        >
          Cart
          {itemCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-tf-black px-1 font-sofia text-[10px] font-black text-tf-white"
            >
              {itemCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}
