/**
 * Shared between `GiftingForm` (client) and `/api/gifting` (server) so the
 * two never drift apart — the client renders these as `<select>`/checkbox
 * options, the server re-validates a submission's `orderSize`/`products`
 * against these exact same value sets rather than trusting the client.
 */

export const ORDER_SIZE_OPTIONS = [
  { value: "20-50", label: "20-50 units" },
  { value: "50-100", label: "50-100 units" },
  { value: "100-250", label: "100-250 units" },
  { value: "250+", label: "250+ units" },
] as const;

export type OrderSize = (typeof ORDER_SIZE_OPTIONS)[number]["value"];

export const ORDER_SIZE_VALUES = ORDER_SIZE_OPTIONS.map((o) => o.value);

export const PRODUCT_OPTIONS = ["Bon Bons", "Chocolate Bars", "Caramels", "Other"] as const;

export type ProductOption = (typeof PRODUCT_OPTIONS)[number];
