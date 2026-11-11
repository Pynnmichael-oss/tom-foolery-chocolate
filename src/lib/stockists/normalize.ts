import type { HubSpotCompany } from "./types";

/**
 * Turns a raw HubSpot company into what's safe and tidy enough to print
 * on a public map — or `null` if it shouldn't be listed at all. Pure
 * (no I/O), so the rules below are easy to read and test in isolation.
 *
 * Company addresses in HubSpot are mostly marketplace *ship-to* addresses
 * (set by TF Ops Sync from Faire/Shopify orders), not curated storefront
 * addresses — hence the cleanup here, and hence `ListingMode`.
 */

/** Every company property this module reads — also the `properties` list
 * the HubSpot search request asks for (see hubspot.ts). */
export const HUBSPOT_PROPERTIES = [
  "name",
  "address",
  "address2",
  "city",
  "state",
  "zip",
  "country",
  "website",
  "phone",
  "instagram_handle",
  "company_category",
  "account_channel",
  "last_order_date",
  "order_count",
  "lifetime_revenue",
  "store_locator_listing",
] as const;

/**
 * - `full`      — name, street address, pin on the address (default).
 * - `city_only` — name and "City, ST" only, pin on the ZIP centroid. For
 *                 accounts whose HubSpot address is a home or a warehouse
 *                 rather than the shop itself.
 * - `hide`      — not on the map at all.
 *
 * Set per company with the optional HubSpot company property
 * `store_locator_listing` (values exactly as above). The property doesn't
 * have to exist — without it everything is `full` except the IDs below.
 */
export type ListingMode = "full" | "city_only" | "hide";

/** Code-side stand-in for `store_locator_listing` until that property
 * exists in HubSpot (a value set there always wins). Keyed by HubSpot
 * company ID. */
const LISTING_OVERRIDES: Record<string, ListingMode> = {
  // Rust & Stardust — HubSpot has a residential ship-to in Rhinelander;
  // the shop itself is elsewhere (Lake Tomahawk, per its own listings).
  "358981698274": "city_only",
  // Relish (Geneva, IL) — "39W640 Sulley Dr" is a residential-subdivision
  // address, not a downtown storefront. Unconfirmed; city-only until the
  // real shop address is in HubSpot.
  "358876206831": "city_only",
};

/** Relationships that buy from us but don't resell to the public. */
const NON_RETAIL_CATEGORIES = new Set(["media", "corporate_gifting"]);
const NON_RETAIL_CHANNELS = new Set(["corporate"]);

const US_STATES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", "district of columbia": "DC",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL",
  indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN",
  mississippi: "MS", missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY",
};
const STATE_CODES = new Set(Object.values(US_STATES));

export interface NormalizedCompany {
  id: string;
  name: string;
  street: string | null;
  city: string;
  state: string;
  zip: string;
  website?: string;
  instagram?: string;
  phone?: string;
}

function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeState(raw: string): string | null {
  const value = clean(raw);
  if (STATE_CODES.has(value.toUpperCase())) return value.toUpperCase();
  return US_STATES[value.toLowerCase()] ?? null;
}

/** "temecula" / "GENEVA" → "Temecula" / "Geneva". Mixed-case input is
 * left alone — someone typed it that way on purpose ("McHenry"). */
function fixShouting(value: string): string {
  if (value !== value.toLowerCase() && value !== value.toUpperCase()) return value;
  return value.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, lead, ch) => lead + ch.toUpperCase());
}

const STARTS_WITH_NUMBER = /^\d/;
const UNIT_LINE = /^(suite|ste\.?|unit|#|apt\.?|floor|fl\.?|bldg\.?|building)\s*\S+/i;

/** One printable street line out of HubSpot's address + address2, which
 * for marketplace orders can hold anything a buyer typed into a shipping
 * form: a legal entity name in line 1, delivery instructions or a PO box
 * in line 2. Returns `null` if nothing in there looks like a street. */
function normalizeStreet(address: string, address2: string): string | null {
  let line1 = clean(address);
  let line2 = clean(address2);

  // "GATHERINGS INC" / "17004 Madison Ave" — the street is on line 2.
  if (!STARTS_WITH_NUMBER.test(line1) && STARTS_WITH_NUMBER.test(line2)) {
    line1 = line2;
    line2 = "";
  }
  if (!STARTS_WITH_NUMBER.test(line1)) return null;

  // "125 N Cache Box 702" — a mailing box isn't part of where the shop is.
  line1 = line1.replace(/,?\s+(p\.?\s?o\.?\s+)?box\s+\d+$/i, "");

  // Keep line 2 only when it's clearly a unit ("Suite 2"), never
  // free-text like "*DELIVER TO LOADING DOCK" or "PO 528".
  const street = UNIT_LINE.test(line2) ? `${line1}, ${line2}` : line1;
  return fixShouting(street);
}

function normalizeWebsite(raw: string): string | undefined {
  const value = clean(raw);
  if (!value) return undefined;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.hostname.includes(".") ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function normalizeInstagram(raw: string): string | undefined {
  const handle = clean(raw).replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? handle : undefined;
}

/** US numbers only, as "(773) 293-6442"; anything else is dropped rather
 * than printed in whatever shape it was typed. */
function normalizePhone(raw: string): string | undefined {
  const digits = clean(raw).replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  if (digits.length !== 10) return undefined;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function listingMode(company: HubSpotCompany): ListingMode {
  const fromHubSpot = clean(company.properties.store_locator_listing).toLowerCase();
  if (fromHubSpot === "full" || fromHubSpot === "city_only" || fromHubSpot === "hide") {
    return fromHubSpot;
  }
  return LISTING_OVERRIDES[company.id] ?? "full";
}

/**
 * The "who counts as a stockist" rules, beyond the 90-day window the
 * HubSpot query itself applies:
 *  - at least one paid order with real revenue (`order_count` already
 *    excludes samples; the revenue check also drops $0 comped orders);
 *  - not a media or corporate-gifting account — they buy, but there's no
 *    shelf for a customer to walk up to;
 *  - a US address complete enough to place (city, state, 5-digit ZIP).
 */
export function normalizeCompany(company: HubSpotCompany): NormalizedCompany | null {
  const p = company.properties;
  const mode = listingMode(company);
  if (mode === "hide") return null;

  if (!(Number(p.order_count) > 0) || !(Number(p.lifetime_revenue) > 0)) return null;
  if (NON_RETAIL_CATEGORIES.has(clean(p.company_category).toLowerCase())) return null;
  if (NON_RETAIL_CHANNELS.has(clean(p.account_channel).toLowerCase())) return null;

  const name = clean(p.name);
  const city = fixShouting(clean(p.city));
  const state = normalizeState(p.state ?? "");
  const zip = clean(p.zip).slice(0, 5);
  if (!name || !city || !state || !/^\d{5}$/.test(zip)) return null;

  const street = mode === "city_only" ? null : normalizeStreet(p.address ?? "", p.address2 ?? "");

  return {
    id: company.id,
    name,
    street,
    city,
    state,
    zip,
    website: normalizeWebsite(p.website ?? ""),
    instagram: normalizeInstagram(p.instagram_handle ?? ""),
    phone: normalizePhone(p.phone ?? ""),
  };
}
