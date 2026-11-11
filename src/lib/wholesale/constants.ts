/**
 * Shared between `WholesaleForm` (client), `/api/wholesale` (server) and
 * the /wholesale page sections, same pattern as lib/gifting/constants.ts.
 */

/**
 * Where "Shop Our Wholesale Catalog" goes. Set
 * NEXT_PUBLIC_FAIRE_DIRECT_URL to the brand's Faire Direct referral link
 * (Faire → Retailers → Invite retailers / Faire Direct link) so orders
 * placed through it are commission-free for us and carry Faire's
 * new-retailer incentives. Falls back to the public Faire brand page so
 * the CTA always lands somewhere real.
 */
export const FAIRE_WHOLESALE_URL: string =
  process.env.NEXT_PUBLIC_FAIRE_DIRECT_URL?.trim() || "https://www.faire.com/brand/b_ke8n3hmnn5";

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
