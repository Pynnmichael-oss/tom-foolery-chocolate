/** One pin on /find-us. */
export interface Stockist {
  /** Stable key for the row — the sheet's "HubSpot ID" when it has one,
   * otherwise derived from name + ZIP. */
  id: string;
  name: string;
  /** Verified storefront street, or `null` when the row isn't `Listed`
   * (see sheet.ts) — the store then shows as "City, ST" with its pin on
   * the ZIP's centre. */
  street: string | null;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  /** True when lat/lng is the geocoded street address; false when it's
   * only the ZIP centroid (city-only listing, or the geocoder missed). */
  precise: boolean;
  website?: string;
  instagram?: string;
  phone?: string;
}

/** A store as read from the sheet, before it has coordinates. */
export type StoreListing = Omit<Stockist, "lat" | "lng" | "precise">;

/** Shape of the committed fallback, `src/data/stockists.json`. */
export interface StockistSnapshot {
  generatedAt: string;
  windowDays: number;
  stockists: Stockist[];
}
