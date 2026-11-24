"use client";

import {
  SALE_CLOSES_LABEL,
  SALE_OPENS_LABEL,
  type SalePhase,
} from "@/lib/mischief-society/config";
import { useSalePhase } from "./useSalePhase";

/** Cinnamon deadline bar across the top of /mischief-society (no countdown). */
export function SocietyRibbon({ initialPhase }: { initialPhase: SalePhase }) {
  const { phase, testMode } = useSalePhase(initialPhase);

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

  // One short line, one size. No countdown.
  const message =
    phase === "pre"
      ? `Doors open ${SALE_OPENS_LABEL}`
      : phase === "live"
        ? `Now open. Memberships close ${SALE_CLOSES_LABEL}.`
        : "Doors are closed for this season.";


  return (
    <div className="bg-tf-cinnamon-strong px-fluid-md py-2.5 text-center text-tf-white">
      <p className="mx-auto max-w-7xl text-sm">
        {message}
      </p>
    </div>
  );
}
