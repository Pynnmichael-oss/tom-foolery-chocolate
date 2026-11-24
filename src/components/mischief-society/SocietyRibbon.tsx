"use client";

import {
  SALE_CLOSES_AT,
  SALE_CLOSES_LABEL,
  SALE_OPENS_LABEL,
  type SalePhase,
} from "@/lib/mischief-society/config";
import { useSalePhase } from "./useSalePhase";

/** "6d 04h 12m" */
function countdown(ms: number): string {
  const t = Math.max(0, ms);
  const d = Math.floor(t / 864e5);
  const h = Math.floor((t % 864e5) / 36e5);
  const m = Math.floor((t % 36e5) / 6e4);
  return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

/** Cinnamon deadline bar across the top of /mischief-society. While the
 * sale is live it counts down to close. */
export function SocietyRibbon({ initialPhase }: { initialPhase: SalePhase }) {
  const { phase, now, testMode } = useSalePhase(initialPhase);

  if (testMode) {
    return (
      <div className="bg-tf-black px-fluid-md py-2.5 text-center text-tf-white">
        <p className="mx-auto max-w-7xl text-sm sm:text-base">
          <span className="font-black tracking-wide">Test mode:</span> checkout is open for testing. The
          public sale opens {SALE_OPENS_LABEL}.
        </p>
      </div>
    );
  }

  // One short line, one size. The timer appears once the browser knows the
  // time (so the server HTML and first client render match); until then the
  // line just names the closing day.
  const message =
    phase === "pre"
      ? `Doors open ${SALE_OPENS_LABEL}`
      : phase === "live"
        ? now === null
          ? `Memberships close ${SALE_CLOSES_LABEL}`
          : `Doors close in ${countdown(Date.parse(SALE_CLOSES_AT) - now)}`
        : "Doors are closed for this season.";

  return (
    <div className="bg-tf-cinnamon-strong px-fluid-md py-2.5 text-center text-tf-white">
      <p className="mx-auto max-w-7xl text-sm tabular-nums">
        {message}
      </p>
    </div>
  );
}
