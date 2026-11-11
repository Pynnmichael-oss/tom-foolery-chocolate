import type { CartAttribute, CartLineInput } from "@/lib/shopify/types";
import type { GiftBuilderConfig, GiftBuilderVariant } from "./queries";

/*
 * HOW A SET IS ADDED TO THE CART (and why) — gift builder handoff v2
 *
 * Each set becomes a GROUP of cart lines that share a "Set" property (A, B, C...):
 *
 *   1. Parent line: the gift set variant (e.g. BYO6-W, $56). Carries the price, box size and
 *      wrap. Properties: Set, Band.
 *   2. Component lines: the actual contents as $0 "(Gift Set)" variants carrying the real SKUs
 *      (B001, B002, B003, F002, F002A), with the quantity of each. Property: Set.
 *
 * Shopify keeps every line on the order, and ShipStation imports each one as an item with its
 * SKU, so picking, pick lists, inventory and reporting all work by SKU. Lines with different
 * "Set" values never merge, so two sets that share a flavor stay separate.
 *
 * HOW DATA REACHES SHIPSTATION (Shopify integration)
 *  - Line item properties -> ShipStation "Item Options" ([Item Options Linebreak]); 200-char cap
 *    per item, and underscore-prefixed properties are imported too, so keep these short and visible.
 *  - Cart NOTE -> order note -> ShipStation "Notes from Buyer": gift messages (see gift-notes.ts).
 *  - Do NOT use cart-level attributes (note_attributes): ShipStation merges them into Notes from Buyer.
 *
 * The packing team and the ShipStation templates read these keys and formats — keep them exactly.
 */

export const ATTR = {
  set: "Set",
  band: "Band",
} as const;

export const SHIPSTATION_ITEM_OPTIONS_LIMIT = 200;

export const WRAP_YES = "Gift Wrapped";
export const WRAP_NO = "No Wrap";

export type BuilderSelection = {
  size: string;
  wrap: boolean;
  /** Flavor (component) product ids, one per slot. Ignored for fixed-content sets. */
  slots: (string | null)[];
  /** Selected band metaobject id. */
  bandId: string | null;
  note: string;
};

/** "3 Bars" -> 3, "8 Caramels" -> 8. */
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

/** "Coffee & Cookies Bar (Gift Set)" -> "Coffee & Cookies". */
export function shortFlavorName(title: string): string {
  return title.replace(/\s*\(Gift Set\)\s*$/i, "").replace(/\s+Bar$/i, "");
}

export function itemOptionsLength(attrs: CartAttribute[]): number {
  return attrs.map((a) => `${a.key}: ${a.value}`).join(", ").length;
}

/** Normalize a gift note to one printable paragraph (line breaks → spaces). */
export function cleanNote(note: string): string {
  return note.replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
}

export type ValidationResult =
  | {
      ok: true;
      /** Parent first, then components — add in ONE cartLinesAdd call. */
      lines: CartLineInput[];
      /** The set's own variant (price, analytics). */
      variant: GiftBuilderVariant;
      giftNote: string | null;
      setLabel: string;
    }
  | { ok: false; error: string };

export function buildCartLines(
  config: GiftBuilderConfig,
  sel: BuilderSelection,
  setLabel: string
): ValidationResult {
  const variant = findVariant(config, sel.size, sel.wrap);
  if (!variant) return { ok: false, error: "That box option is unavailable." };
  if (!variant.availableForSale) return { ok: false, error: "That box is sold out right now." };

  const required = slotCount(sel.size);
  const setAttr: CartAttribute = { key: ATTR.set, value: setLabel };
  const components: CartLineInput[] = [];

  if (config.flavors.length > 0) {
    // Pick-your-flavors set: one component line per flavor, quantity = bars of that flavor.
    const filled = sel.slots.filter(Boolean).length;
    if (filled !== required) {
      const missing = required - filled;
      return { ok: false, error: `Pick ${missing} more bar${missing === 1 ? "" : "s"}.` };
    }
    const counts = new Map<string, number>();
    for (const id of sel.slots) if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    for (const f of config.flavors) {
      const qty = counts.get(f.id);
      if (!qty) continue;
      if (!f.availableForSale) return { ok: false, error: `${shortFlavorName(f.title)} is sold out right now.` };
      components.push({ merchandiseId: f.variantId, quantity: qty, attributes: [setAttr] });
    }
  } else if (config.fixedContents.length > 0) {
    // Fixed-content set: the component variant whose count matches the set size.
    const c = config.fixedContents.find((x) => x.count === required);
    if (!c) return { ok: false, error: "That box option is unavailable." };
    if (!c.availableForSale) return { ok: false, error: "That box is sold out right now." };
    components.push({ merchandiseId: c.variantId, quantity: 1, attributes: [setAttr] });
  }

  const band = config.bands.find((b) => b.id === sel.bandId);
  if (config.bands.length > 0 && !band) return { ok: false, error: "Choose a band." };

  const note = cleanNote(sel.note);
  if (note.length > config.noteMaxLength) {
    return { ok: false, error: `Notes can be up to ${config.noteMaxLength} characters.` };
  }

  const parentAttrs: CartAttribute[] = [setAttr, ...(band ? [{ key: ATTR.band, value: band.name }] : [])];
  if (itemOptionsLength(parentAttrs) > SHIPSTATION_ITEM_OPTIONS_LIMIT) {
    return { ok: false, error: "This set has too many details to print. Please contact us." };
  }

  return {
    ok: true,
    // Parent first so the box/wrap/band line leads the group on the pick list.
    lines: [{ merchandiseId: variant.id, quantity: 1, attributes: parentAttrs }, ...components],
    variant,
    giftNote: note || null,
    setLabel,
  };
}
