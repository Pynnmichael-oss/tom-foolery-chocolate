import centroids from "@/data/zip-centroids.json";

/**
 * US ZIP → approximate centre point, from a bundled table (see
 * scripts/build-zip-centroids.ts) rather than a third-party API: the
 * locator's one search box shouldn't depend on someone else's uptime or
 * rate limits, and a visitor's ZIP never leaves this site.
 *
 * Server-only by convention — the table is ~1 MB, so the browser asks
 * `/api/zip/[zip]` for the one row it needs instead of importing this.
 */
const TABLE = centroids as unknown as Record<string, [number, number]>;

export interface LatLng {
  lat: number;
  lng: number;
}

export function lookupZip(zip: string): LatLng | null {
  const hit = /^\d{5}$/.test(zip) ? TABLE[zip] : undefined;
  return hit ? { lat: hit[0], lng: hit[1] } : null;
}
