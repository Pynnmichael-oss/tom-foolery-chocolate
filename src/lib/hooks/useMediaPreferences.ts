"use client";

import { useEffect, useState } from "react";

/**
 * `navigator.connection` (the Network Information API) is still
 * experimental and not in TS's DOM lib — this is the sliver of it BrandVideo
 * actually reads, typed locally rather than pulling in a whole shim.
 */
interface NetworkInformationLike {
  saveData?: boolean;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
}

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
};

function readSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  return (navigator as NavigatorWithConnection).connection?.saveData ?? false;
}

/**
 * Combined "is brand motion okay right now" signal — false whenever the
 * user has asked for reduced motion OR is on a metered/constrained
 * connection (`navigator.connection.saveData`). `BrandVideo` uses this to
 * decide between an actual `<video>` and a static poster fallback.
 *
 * SSR-safe: both flags start `false` (motion allowed) on the very first
 * render, matching what a server render produces with no access to either
 * signal, then correct themselves via effects immediately on mount. A
 * reduced-motion or data-saver visitor may see one frame's worth of
 * video-capable markup before the fallback applies — unavoidable without a
 * client hint, and the standard trade-off for this kind of preference
 * detection. Both signals stay live via their respective `change` events,
 * so toggling either mid-session (OS setting, browser data-saver toggle)
 * updates the component without a reload.
 */
export function useMediaPreferences() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setPrefersReducedMotion(mql.matches);
    updateMotion();
    mql.addEventListener("change", updateMotion);

    const connection = (navigator as NavigatorWithConnection).connection;
    const updateSaveData = () => setSaveData(readSaveData());
    updateSaveData();
    connection?.addEventListener?.("change", updateSaveData);

    return () => {
      mql.removeEventListener("change", updateMotion);
      connection?.removeEventListener?.("change", updateSaveData);
    };
  }, []);

  return { prefersReducedMotion, saveData };
}
