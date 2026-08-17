"use client";

import { useEffect, useState } from "react";

/**
 * True only on devices that can genuinely hover with a fine pointer (mouse,
 * trackpad) — false for touch-primary devices, where mobile browsers'
 * "sticky hover" (a tap can leave `:hover` engaged until the next tap
 * elsewhere) would otherwise make hover-triggered UI misbehave.
 *
 * SSR-safe: starts `false` (matching a server render, which has no access
 * to `matchMedia`) and corrects itself via an effect on mount — the same
 * trade-off documented on `useMediaPreferences`.
 */
export function useHoverCapableDevice(): boolean {
  const [isHoverCapable, setIsHoverCapable] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setIsHoverCapable(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isHoverCapable;
}
