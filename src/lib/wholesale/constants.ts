/**
 * Shared between `WholesaleForm` (client), `/api/wholesale` (server) and
 * the /wholesale page sections, same pattern as lib/gifting/constants.ts.
 */

/**
 * Where "Shop Our Wholesale Catalog" goes — the brand's Faire Direct link,
 * so retailer orders placed through it are commission-free and carry
 * Faire's new-retailer incentives. Public, so it lives here; set
 * NEXT_PUBLIC_FAIRE_DIRECT_URL only to override it without a code change.
 */
export const FAIRE_WHOLESALE_URL: string =
  process.env.NEXT_PUBLIC_FAIRE_DIRECT_URL?.trim() || "https://tomfoolerychocolates.faire.com";

export const FAIRE_CTA_LABEL = "Shop Our Wholesale Catalog";

/** id of the on-page inquiry section + its first field (for scroll/focus). */
export const WHOLESALE_FORM_ANCHOR = "wholesale-inquiry";
export const WHOLESALE_FORM_FIRST_FIELD = "tf-wholesale-first-name";

export const BUSINESS_TYPE_OPTIONS = [
  "Gift Shop / Boutique",
  "Specialty Grocery / Market",
  "Coffee Shop / Café",
  "Bookstore",
  "Hotel / Hospitality",
  "Distributor",
  "Corporate / Office",
  "Other",
] as const;

export type BusinessType = (typeof BUSINESS_TYPE_OPTIONS)[number];
