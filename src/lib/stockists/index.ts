import snapshotJson from "@/data/stockists.json";
import { geocodeAddress } from "./geocode";
import { fetchSheetCsv, listingsFromCsv } from "./sheet";
import type { Stockist, StockistSnapshot, StoreListing } from "./types";
import { lookupZip } from "./zip";

export type { Stockist } from "./types";
export { SHEET_REVALIDATE_SECONDS } from "./sheet";

/** A store drops off the map this many days after its last paid order. */
export const STOCKIST_WINDOW_DAYS = 90;

const snapshot = snapshotJson as StockistSnapshot;

/** Census asks for no particular rate limit; this just keeps a cold
 * cache from opening dozens of connections at once. */
const GEOCODE_CONCURRENCY = 4;

/**
 * Gives each listing coordinates. Shared by the live path below and by
 * scripts/sync-stockists.ts (which writes the committed snapshot), so
 * both always behave identically.
 *
 * `known` lets a caller skip the geocoder for any store that's already
 * been placed at the same street + ZIP.
 */
export async function locateListings(
  listings: StoreListing[],
  known: Stockist[] = []
): Promise<Stockist[]> {
  const knownById = new Map(known.map((s) => [s.id, s]));
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

async function locate(listing: StoreListing, prior?: Stockist): Promise<Stockist | null> {
  if (
    prior &&
    prior.street === listing.street &&
    prior.zip === listing.zip &&
    (prior.precise || listing.street === null)
  ) {
    return { ...listing, lat: prior.lat, lng: prior.lng, precise: prior.precise };
  }

  if (listing.street) {
    // The geocoder matches on the building; a trailing ", Suite 2" only
    // gives it something to miss on.
    const building = listing.street.split(",")[0];
    const point = await geocodeAddress(
      `${building}, ${listing.city}, ${listing.state} ${listing.zip}`
    );
    if (point) return { ...listing, ...point, precise: true };
  }

  // No street to show, or the geocoder couldn't place it: the ZIP's
  // centre still puts the pin in the right town and keeps the store in
  // "nearest to me" results. No ZIP match at all → not mappable.
  const centroid = lookupZip(listing.zip);
  return centroid ? { ...listing, ...centroid, precise: false } : null;
}

/**
 * Everything /find-us shows.
 *
 * Live from the Google Sheet (see sheet.ts): re-read about hourly, with
 * the rolling 90-day window applied on every read, so an edit in the
 * sheet shows up on its own and a store falls off 90 days after its
 * last paid order.
 *
 * If the sheet can't be read (Google down, tab unpublished, no network
 * at build time) or comes back with no usable rows, it serves the
 * committed snapshot (src/data/stockists.json) instead: real stores,
 * frozen at whenever `npm run sync-stockists` last ran.
 */
export async function getStockists(): Promise<Stockist[]> {
  try {
    const listings = listingsFromCsv(await fetchSheetCsv(), STOCKIST_WINDOW_DAYS);
    // An empty result means the sheet's header row was renamed or the
    // wrong tab was published — far likelier than every store lapsing
    // at once — so don't blank the map over it.
    if (listings.length === 0) throw new Error("Store sheet has no usable rows");
    return await locateListings(listings, snapshot.stockists);
  } catch (error) {
    console.error("[stockists] Store sheet read failed — serving the committed snapshot instead.", error);
    return snapshot.stockists;
  }
}
