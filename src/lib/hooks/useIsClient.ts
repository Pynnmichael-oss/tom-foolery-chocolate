"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True only once mounted on the client — `false` during SSR and the
 * first client render (which must match SSR to hydrate cleanly), `true`
 * from the next render on. The modern replacement for the old
 * `useState(false)` + `useEffect(() => setMounted(true), [])` pattern
 * (used for exactly this — MobileNav's portal, which needs a real
 * `document.body` to render into): that pattern calls a `useState`
 * setter unconditionally inside an effect, which the `set-state-in-effect`
 * lint rule (eslint-plugin-react-hooks 7+) flags. `useSyncExternalStore`
 * with a snapshot that's `false` on the server and `true` on the client
 * is React's own documented way to get this without an effect at all.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
