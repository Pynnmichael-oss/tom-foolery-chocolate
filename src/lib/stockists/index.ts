import snapshotJson from "@/data/stockists.json";
import { geocodeAddress } from "./geocode";
import { fetchRecentBuyers, isHubSpotConfigured } from "./hubspot";
import { normalizeCompany, type NormalizedCompany } from "./normalize";
import type { HubSpotCompany, Stockist, StockistSnapshot } from "./types";
import { lookupZip } from "./zip";

export type { Stockist } from "./types";
export { STOCKIST_REVALIDATE_SECONDS } from "./hubspot";

/** A store drops off the map this many days after its last paid order. */
export const STOCKIST_WINDOW_DAYS = 90;

const snapshot = snapshotJson as StockistSnapshot;

/** Census asks for no particular rate limit; this just keeps a cold
 * cache from opening dozens of connections at once. */
const GEOCODE_CONCURRENCY = 4;

/**
 * Raw HubSpot companies → publishable, located stockists. Shared by the
 * live path below and by scripts/sync-stockists.ts (which writes the
 * committed snapshot), so both always apply identical rules.
 *
 * `known` lets a caller skip the geocoder for any store that's already
 * been placed at the same street + ZIP.
 */
export async function buildStockists(
  companies: HubSpotCompany[],
  known: Stockist[] = []
): Promise<Stockist[]> {
  const knownById = new Map(known.map((s) => [s.id, s]));
  const listings = companies
    .map(normalizeCompany)
    .filter((c): c is NormalizedCompany => c !== null);

  const located: Array<Stockist | null> = new Array(listings.length).fill(null);
  let next = 0;

  async function worker() {
    while (next < listings.length) {
      const index = next++;
      located[index] = await locate(listings[index], knownById.get(listings[index].id));
    }
  }
  await Promise.all(Array.from({ length: GEOCODE_CONCURRENCY }, worker));

  return located
    .filter((s): s is Stockist => s !== null)
    .sort(
      (a, b) =>
        a.state.localeCompare(b.state) ||
        a.city.localeCompare(b.city) ||
        a.name.localeCompare(b.name)
    );
}

async function locate(listing: NormalizedCompany, prior?: Stockist): Promise<Stockist | null> {
  if (
    prior &&
    prior.street === listing.street &&
    prior.zip === listing.zip &&
    (prior.precise || listing.street === null)
  ) {
    return { ...listing, lat: prior.lat, lng: prior.lng, precise: prior.precise };
  }

  if (listing.street) {
    const point = await geocodeAddress(
      `${listing.street}, ${listing.city}, ${listing.state} ${listing.zip}`
    );
    if (point) return { ...listing, ...point, precise: true };
  }

  // City-only listing, or the geocoder couldn't place the street: the
  // ZIP's centre still puts the pin in the right town and keeps the
  // store in "nearest to me" results. No ZIP match at all → not mappable.
  const centroid = lookupZip(listing.zip);
  return centroid ? { ...listing, ...centroid, precise: false } : null;
}

/**
 * Everything /find-us shows.
 *
 * With HUBSPOT_ACCESS_TOKEN set this is live: the rolling 90-day window
 * is re-applied every time the HubSpot response revalidates (see
 * STOCKIST_REVALIDATE_SECONDS), so stores appear after their first paid
 * order and drop off on their own once they stop reordering.
 *
 * Without the token — local dev, previews, or before it's been added in
 * Vercel — or if HubSpot errors, it serves the committed snapshot
 * (src/data/stockists.json): real stores, frozen at whenever
 * `npm run sync-stockists` last ran. Unlike the Shopify mock-data
 * fallback this is genuine data, so it's safe to show in production; it
 * just doesn't move on its own.
 */
export async function getStockists(): Promise<Stockist[]> {
  if (!isHubSpotConfigured()) return snapshot.stockists;

  try {
    const companies = await fetchRecentBuyers(STOCKIST_WINDOW_DAYS);
    return await buildStockists(companies, snapshot.stockists);
  } catch (error) {
    console.error("[stockists] HubSpot fetch failed — serving the committed snapshot instead.", error);
    return snapshot.stockists;
  }
}
