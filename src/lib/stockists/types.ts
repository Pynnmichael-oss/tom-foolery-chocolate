/** One pin on /find-us. Only fields that are safe to publish — no order
 * counts, revenue, or contact people ever leave the server. */
export interface Stockist {
  /** HubSpot company record ID. */
  id: string;
  name: string;
  /** `null` for a "city only" listing (see `ListingMode` in normalize.ts)
   * — the store shows as "City, ST" with its pin on the ZIP's centroid. */
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

/** A HubSpot company as the CRM search API returns it. */
export interface HubSpotCompany {
  id: string;
  properties: Record<string, string | null | undefined>;
}

/** Shape of the committed fallback, `src/data/stockists.json`. */
export interface StockistSnapshot {
  generatedAt: string;
  windowDays: number;
  stockists: Stockist[];
}
