import type { HubSpotCompany } from "./types";

/**
 * Turns a raw HubSpot company into what's safe and tidy enough to print
 * on a public map — or `null` if it shouldn't be listed at all. Pure
 * (no I/O), so the rules below are easy to read and test in isolation.
 *
 * Two different addresses live on a HubSpot company, and only one of
 * them is ours to publish:
 *
 *  - `address`/`city`/`state`/`zip` — for most accounts, wherever a
 *    marketplace order was *shipped* (set by TF Ops Sync, which also
 *    matches future orders on it via `address_key`). Often the shop;
 *    sometimes the owner's house. Never shown as a street address here.
 *  - `storefront_address`/`_city`/`_state`/`_zip` — the shop a customer
 *    walks into, entered by a person. The only street address this page
 *    will ever print, and only once `store_locator_status` says so.
 */

/** Every company property this module reads — also the `properties` list
 * the HubSpot search request asks for (see hubspot.ts). */
export const HUBSPOT_PROPERTIES = [
  "name",
  "city",
  "state",
  "zip",
  "storefront_address",
  "storefront_city",
  "storefront_state",
  "storefront_zip",
  "store_locator_status",
  "website",
  "phone",
  "instagram_handle",
  "company_category",
  "account_channel",
  "last_order_date",
  "order_count",
  "lifetime_revenue",
] as const;

/**
 * HubSpot company property `store_locator_status`:
 *
 * - `listed`       — storefront address verified: name, street, pin on
 *                    the address.
 * - `needs_review` — the default, and what an empty value means: name
 *                    and "City, ST" only, pin on the ZIP's centre. A
 *                    brand-new account shows up on the map straight
 *                    away, but nobody's home address can be published
 *                    just because a box was shipped there.
 * - `city_only`    — same display as `needs_review`, chosen on purpose
 *                    (no public shop, seasonal stall, owner's request).
 * - `hidden`       — not on the map at all.
 */
type LocatorStatus = "listed" | "needs_review" | "city_only" | "hidden";

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

function locatorStatus(company: HubSpotCompany): LocatorStatus {
  const value = clean(company.properties.store_locator_status).toLowerCase();
  return value === "listed" || value === "city_only" || value === "hidden" ? value : "needs_review";
}

/**
 * The "who counts as a stockist" rules, beyond the 90-day window the
 * HubSpot query itself applies:
 *  - at least one paid order with real revenue (`order_count` already
 *    excludes samples; the revenue check also drops $0 comped orders);
 *  - not a media or corporate-gifting account — they buy, but there's no
 *    shelf for a customer to walk up to;
 *  - a US city, state and 5-digit ZIP to place it by;
 *  - `store_locator_status` isn't `hidden`.
 */
export function normalizeCompany(company: HubSpotCompany): NormalizedCompany | null {
  const p = company.properties;
  const status = locatorStatus(company);
  if (status === "hidden") return null;

  if (!(Number(p.order_count) > 0) || !(Number(p.lifetime_revenue) > 0)) return null;
  if (NON_RETAIL_CATEGORIES.has(clean(p.company_category).toLowerCase())) return null;
  if (NON_RETAIL_CHANNELS.has(clean(p.account_channel).toLowerCase())) return null;

  // Where the shop is: the storefront fields when they're filled in
  // (the shop can be in a different town from the ship-to), otherwise
  // the ship-to's town — a town is safe to show, a street isn't.
  const hasStorefrontPlace = Boolean(clean(p.storefront_city) && clean(p.storefront_zip));
  const name = clean(p.name);
  const city = fixShouting(clean(hasStorefrontPlace ? p.storefront_city : p.city));
  const state = normalizeState((hasStorefrontPlace && clean(p.storefront_state)) || (p.state ?? ""));
  const zip = clean(hasStorefrontPlace ? p.storefront_zip : p.zip).slice(0, 5);
  if (!name || !city || !state || !/^\d{5}$/.test(zip)) return null;

  // `listed` with no storefront street (someone flipped the status but
  // never typed the address) degrades to city-only rather than falling
  // back to the ship-to.
  const street = status === "listed" && hasStorefrontPlace ? clean(p.storefront_address) || null : null;

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
