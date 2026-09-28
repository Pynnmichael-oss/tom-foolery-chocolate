"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { useLenis } from "@/components/providers/SmoothScroll";

const NAV_LINKS = [
  { href: "/story", label: "Story" },
  { href: "/shop", label: "Shop" },
  { href: "/gifting", label: "Gifting" },
  { href: "/contact", label: "Contact" },
];

const TOGGLE_BAR_CLASS =
  "block h-[2px] w-6 rounded-full bg-tf-black transition-transform duration-200 motion-reduce:transition-none";

/**
 * Mobile nav — hamburger toggle (`sm:hidden`, same breakpoint `Nav`'s own
 * desktop link row switches on) + a full-screen `--tf-black` overlay
 * beneath the sticky header (the header's own `z-50` keeps the logo/
 * toggle/cart visible and usable the whole time; this panel is `z-40`).
 *
 * - **Focus**: trapped inside the panel while open (`useFocusTrap`, same
 *   hook `CartDrawer` uses), Escape closes it, focus returns to the
 *   toggle button on close.
 * - **Inert background**: `#main-content`, `<footer>`, and the cart
 *   drawer's root (`#cart-drawer-root`) all get `inert` while open — a
 *   screen reader or Tab press can't reach anything behind the overlay,
 *   not just whatever the focus trap happens to catch. Targeted by
 *   id/tag rather than a ref, since none of those three live inside this
 *   component's own tree (they're rendered elsewhere in the root layout).
 * - **Lenis**: stopped while open, restarted on close (`useLenis`) — the
 *   overlay is fully opaque and covers the viewport either way, but a
 *   background scroll shouldn't be running underneath a modal.
 * - **Closes on route change**: `Nav` renders this with `key={pathname}`,
 *   so any navigation (a link inside the panel, or back/forward) remounts
 *   the whole component fresh — `isOpen` resets to its initial `false`
 *   without an effect (React's own recommended alternative to
 *   "reset state when an external value changes" via an effect + a
 *   `useState` setter, which the `set-state-in-effect` lint rule flags).
 * - **Reduced motion**: the open/close transition is a plain CSS
 *   `transition-opacity`; `globals.css`'s global
 *   `prefers-reduced-motion: reduce` rule already collapses all
 *   transition durations to ~0, and `motion-reduce:transition-none`
 *   below is the same belt-and-suspenders `CartDrawer` uses on top of
 *   that.
 */
export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  // Portals need a real `document.body` to render into — true only once
  // mounted on the client (see useIsClient), so SSR (no DOM to portal to)
  // renders just the toggle button, same as any no-JS visitor sees either
  // way (the button does nothing without JS regardless of whether the
  // panel markup exists).
  const mounted = useIsClient();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const lenis = useLenis();

  useFocusTrap({ isOpen, onClose: () => setIsOpen(false), panelRef });

  useEffect(() => {
    const main = document.getElementById("main-content");
    const footer = document.querySelector("footer");
    if (main) main.inert = isOpen;
    if (footer) footer.inert = isOpen;

    // #cart-drawer-root already manages its own `inert` independently
    // (CartDrawer's `isDrawerOpen`-driven `inert` prop) — only ever force
    // it inert while THIS panel is open (so it can't be reached even if
    // it were open underneath), never force it back to non-inert on
    // close. Unconditionally setting `.inert = isOpen` here (matching
    // main/footer above) would, on this component's very first mount
    // (isOpen starts false), overwrite CartDrawer's own correct
    // `inert="true"` with `false` — and since that write happens outside
    // React, React's reconciler never notices the DOM has drifted from
    // what it last committed, so it never repairs it either. Confirmed by
    // hand: that exact bug made the entire header unclickable by mouse/
    // touch (a transparent, non-inert, viewport-covering cart-drawer
    // overlay sits above it) shortly after hydration.
    const cartRoot = document.getElementById("cart-drawer-root");
    if (cartRoot && isOpen) cartRoot.inert = true;
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) lenis?.stop();
    else lenis?.start();
  }, [isOpen, lenis]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="relative flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-[5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon focus-visible:ring-offset-2 sm:hidden"
      >
        <span
          aria-hidden="true"
          className={`${TOGGLE_BAR_CLASS} ${isOpen ? "translate-y-[7px] rotate-45" : ""}`}
        />
        <span
          aria-hidden="true"
          className={`${TOGGLE_BAR_CLASS} ${isOpen ? "opacity-0" : "opacity-100"}`}
        />
        <span
          aria-hidden="true"
          className={`${TOGGLE_BAR_CLASS} ${isOpen ? "-translate-y-[7px] -rotate-45" : ""}`}
        />
      </button>

      {/* Portaled to document.body, not rendered in place: this component
       * lives inside `<header>`, which has `backdrop-blur-sm`
       * (`backdrop-filter`) — a CSS property that makes an element the
       * *containing block* for its `position: fixed` descendants (same
       * rule `filter`/`transform`/`will-change: transform` trigger).
       * Without the portal, `inset-0` resolved against the header's own
       * (short) box instead of the viewport — confirmed by hand: the
       * panel only ever covered the header strip, not the screen. */}
      {mounted &&
        createPortal(
          <div
            id="mobile-nav-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            inert={!isOpen}
            className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-fluid-lg bg-tf-black transition-opacity duration-300 motion-reduce:transition-none sm:hidden ${
              isOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                // This panel (and these links) exist in the DOM on every
                // page, at every viewport width, even when closed and
                // `sm:hidden` — only `display:none` (desktop) actually
                // removes an element from layout; below that breakpoint
                // it's merely `opacity-0`/`pointer-events-none`, still
                // occupying its full-viewport box. `next/link`'s default
                // prefetch is viewport-intersection-triggered, so without
                // this it fires on every load regardless of whether the
                // menu is ever opened — confirmed by hand (Lighthouse
                // network panel): 4 links × 2 requests each, entirely
                // avoidable extra work competing for bandwidth/main-thread
                // time during the page's own initial load.
                prefetch={false}
                className="font-sans text-2xl font-black uppercase tracking-[0.075em] text-tf-white transition-colors hover:text-tf-turmeric"
              >
                {link.label}
              </Link>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
