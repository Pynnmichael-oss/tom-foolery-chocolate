import type { CartAttribute } from "@/lib/shopify/types";
import type { GiftBuilderConfig, GiftBuilderVariant } from "./queries";

/**
 * Cart line attributes become order line item properties in Shopify,
 * which ShipStation imports as item options. The packing team reads
 * these, and the ShipStation packing slip template prints them, so keep
 * the keys and value formats exactly as they are:
 *
 *   Flavors:   Coffee & Cookies x2, Cornflake Crunch x1
 *   Band:      Season's Treatings (Holiday)
 *   Gift Note: Happy holidays, Mom!
 *   _builder:  build-your-own-bar-gift-set@v1   (hidden from the shopper)
 */
export const ATTR = {
  flavors: "Flavors",
  band: "Band",
  note: "Gift Note",
  builder: "_builder", // underscore = hidden from the shopper at checkout
} as const;

export const WRAP_YES = "Gift Wrapped";
export const WRAP_NO = "No Wrap";

export type BuilderSelection = {
  size: string;
  wrap: boolean;
  /** Flavor product ids, one per slot. Ignored for fixed-flavor sets. */
  slots: (string | null)[];
  /** Selected band metaobject id. */
  bandId: string | null;
  note: string;
};

export type GiftSetLine = {
  variant: GiftBuilderVariant;
  attributes: CartAttribute[];
};

/** "3 Bars" → 3, "8 Caramels" → 8. */
export function slotCount(size: string): number {
  const n = parseInt(size, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function findVariant(
  config: GiftBuilderConfig,
  size: string,
  wrap: boolean
): GiftBuilderVariant | undefined {
  const wrapValue = wrap ? WRAP_YES : WRAP_NO;
  return config.variants.find(
    (v) =>
      v.selectedOptions.some((o) => o.name === config.sizeOptionName && o.value === size) &&
      v.selectedOptions.some((o) => o.name === config.wrapOptionName && o.value === wrapValue)
  );
}

/** "Coffee & Cookies Bar" → "Coffee & Cookies". */
export function flavorLabel(title: string): string {
  return title.replace(/\s+Bar$/i, "");
}

/** "Coffee & Cookies x2, Cornflake Crunch x1", in the order flavors are listed in Shopify. */
export function summarizeFlavors(config: GiftBuilderConfig, slots: (string | null)[]): string {
  const counts = new Map<string, number>();
  for (const id of slots) if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  return config.flavors
    .filter((f) => counts.has(f.id))
    .map((f) => `${flavorLabel(f.title)} x${counts.get(f.id)}`)
    .join(", ");
}

/** Trims, collapses trailing spaces before line breaks. */
export function cleanNote(note: string): string {
  return note.trim().replace(/[ \t]+\n/g, "\n");
}

export type ValidationResult = { ok: true; line: GiftSetLine } | { ok: false; error: string };

/**
 * Validates a builder selection and turns it into one cart line. Price
 * can't be tampered with — it comes from the variant. Attributes could
 * be edited by a determined user, which is acceptable here.
 */
export function buildCartLine(config: GiftBuilderConfig, sel: BuilderSelection): ValidationResult {
  const variant = findVariant(config, sel.size, sel.wrap);
  if (!variant) return { ok: false, error: "That box option is unavailable." };
  if (!variant.availableForSale) return { ok: false, error: "That box is sold out right now." };

  const needsFlavors = config.flavors.length > 0;
  const validIds = new Set(config.flavors.map((f) => f.id));
  const filled = sel.slots.filter((id) => id && validIds.has(id)).length;
  const required = slotCount(sel.size);
  if (needsFlavors && filled !== required) {
    const missing = required - filled;
    return { ok: false, error: `Pick ${missing} more bar${missing === 1 ? "" : "s"}.` };
  }

  const band = config.bands.find((b) => b.id === sel.bandId);
  if (config.bands.length > 0 && !band) {
    return { ok: false, error: "Choose a band." };
  }

  const note = cleanNote(sel.note);
  if (note.length > config.noteMaxLength) {
    return { ok: false, error: `Notes can be up to ${config.noteMaxLength} characters.` };
  }

  const attributes: CartAttribute[] = [];
  if (needsFlavors) attributes.push({ key: ATTR.flavors, value: summarizeFlavors(config, sel.slots) });
  if (band) attributes.push({ key: ATTR.band, value: `${band.name} (${band.category})` });
  if (note) attributes.push({ key: ATTR.note, value: note });
  attributes.push({ key: ATTR.builder, value: `${config.handle}@v1` });

  return { ok: true, line: { variant, attributes } };
}
