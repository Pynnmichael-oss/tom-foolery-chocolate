import type { LatLng } from "./zip";

/**
 * Street address → coordinates via the US Census Bureau geocoder: free,
 * no API key, no usage agreement, US addresses only (which is every
 * stockist). https://geocoding.geo.census.gov/geocoder/
 *
 * Cached with `force-cache`, keyed by URL — i.e. by address. An address
 * is looked up once and then served from Next's data cache for good, so
 * a revalidation of /find-us only ever geocodes accounts that are new
 * (or whose address changed) since the last one.
 */
const ENDPOINT = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";

interface CensusResponse {
  result?: { addressMatches?: Array<{ coordinates?: { x?: number; y?: number } }> };
}

/** Resolves to `null` — never throws — when the address has no match or
 * the geocoder is slow/down; the caller falls back to the ZIP centroid. */
export async function geocodeAddress(oneLineAddress: string): Promise<LatLng | null> {
  const url = `${ENDPOINT}?${new URLSearchParams({
    address: oneLineAddress,
    benchmark: "Public_AR_Current",
    format: "json",
  })}`;

  try {
    const response = await fetch(url, {
      cache: "force-cache",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as CensusResponse;
    const point = body.result?.addressMatches?.[0]?.coordinates;
    if (typeof point?.x !== "number" || typeof point?.y !== "number") return null;
    return { lat: round(point.y), lng: round(point.x) };
  } catch {
    return null;
  }
}

/** 5 decimal places ≈ 1 m — plenty for a pin. */
function round(value: number): number {
  return Math.round(value * 1e5) / 1e5;
}
