"use client";

import {
  SALE_CLOSES_AT,
  SALE_OPENS_AT,
  SALE_OPENS_LABEL,
  type SalePhase,
} from "@/lib/mischief-society/config";
import { useSalePhase } from "./useSalePhase";

function countdown(ms: number): string {
  const t = Math.max(0, ms);
  const d = Math.floor(t / 864e5);
  const h = Math.floor((t % 864e5) / 36e5);
  const m = Math.floor((t % 36e5) / 6e4);
  return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

/** Cinnamon deadline bar across the top of /mischief-society. */
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

  const message =
    phase === "pre"
      ? `Doors open ${SALE_OPENS_LABEL}. Members-only for four days.`
      : phase === "live"
        ? "Now open. Memberships close Cyber Monday at midnight."
        : "Doors are closed for this season.";

  // Countdown only once the browser knows the time, so the server HTML
  // and first client render match.
  const count =
    now === null || phase === "closed"
      ? null
      : phase === "pre"
        ? `Opens in ${countdown(Date.parse(SALE_OPENS_AT) - now)}`
        : `Closes in ${countdown(Date.parse(SALE_CLOSES_AT) - now)}`;

  return (
    <div className="bg-tf-cinnamon-strong px-fluid-md py-2.5 text-center text-tf-white">
      <p className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm sm:text-base">
        <span>{message}</span>
        {count && <span className="font-black tabular-nums tracking-wide">{count}</span>}
      </p>
    </div>
  );
}
