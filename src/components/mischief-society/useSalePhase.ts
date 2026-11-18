"use client";

import { useEffect, useState } from "react";
import { TEST_MODE_PARAM, salePhase, type SalePhase } from "@/lib/mischief-society/config";

/**
 * The sale phase as of right now in the browser. Starts from the server's
 * value (so the first client render matches the HTML), then re-checks
 * every 30s — the page is cached, so the server's answer can be a few
 * minutes old at the moment doors open or close.
 *
 * With ?test in the URL the phase is always "live" (see TEST_MODE_PARAM).
 */
export function useSalePhase(
  initial: SalePhase
): { phase: SalePhase; now: number | null; testMode: boolean } {
  const [state, setState] = useState<{ phase: SalePhase; now: number | null; testMode: boolean }>({
    phase: initial,
    now: null,
    testMode: false,
  });

  useEffect(() => {
    const testMode = new URLSearchParams(window.location.search).has(TEST_MODE_PARAM);
    const tick = () => {
      const now = Date.now();
      setState({ phase: testMode ? "live" : salePhase(now), now, testMode });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return state;
}
