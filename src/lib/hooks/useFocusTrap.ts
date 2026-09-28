"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface UseFocusTrapOptions {
  /** Whether the panel is currently open/visible. */
  isOpen: boolean;
  /** Called on Escape — the caller owns the actual close (state update). */
  onClose: () => void;
  /** The trap boundary — Tab/Shift+Tab cycles within this element's own
   * focusable descendants only. */
  panelRef: RefObject<HTMLElement | null>;
  /** Focused on open instead of the panel's first focusable element
   * (CartDrawer's own close button, for instance). Defaults to the
   * panel's first focusable descendant. */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Shared modal focus-trap behavior — extracted from `CartDrawer` (the
 * original implementation) so `MobileNav` doesn't duplicate the same
 * ~40 lines: moves focus into the panel on open (`initialFocusRef`, or
 * else the panel's own first focusable element), restores whatever had
 * focus before on close, traps Tab/Shift+Tab within the panel while open,
 * and calls `onClose` on Escape.
 */
export function useFocusTrap({ isOpen, onClose, panelRef, initialFocusRef }: UseFocusTrapOptions) {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Move focus into the panel on open, restore it on close.
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      const target =
        initialFocusRef?.current ??
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      target?.focus();
    } else {
      previouslyFocusedRef.current?.focus?.();
    }
  }, [isOpen, initialFocusRef, panelRef]);

  // ESC to close + Tab focus trap.
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
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
  }, [isOpen, onClose, panelRef]);
}
