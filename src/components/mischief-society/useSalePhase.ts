"use client";

import { useEffect, useState } from "react";
import { salePhase, type SalePhase } from "@/lib/mischief-society/config";

/**
 * The sale phase as of right now in the browser. Starts from the server's
 * value (so the first client render matches the HTML), then re-checks
 * every 30s — the page is cached, so the server's answer can be a few
 * minutes old at the moment doors open or close.
 */
export function useSalePhase(initial: SalePhase): { phase: SalePhase; now: number | null } {
  const [state, setState] = useState<{ phase: SalePhase; now: number | null }>({
    phase: initial,
    now: null,
  });

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setState({ phase: salePhase(now), now });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return state;
}
