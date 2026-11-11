/**
 * Gift set builder config (/gifts/build), read from Shopify so bands,
 * flavors and the note length can change in admin without a deploy:
 *
 *   gift_builder.bands            list.metaobject_reference → `gift_band`
 *                                 metaobjects (name, category, image), in
 *                                 display order
 *   gift_builder.flavors          list.product_reference (bar sets only;
 *                                 empty = fixed-flavor set, no flavor step)
 *   gift_builder.note_max_length  number_integer
 *
 * Box size and gift wrap are product *variants* (first option = size,
 * second = "Gift Wrap": "No Wrap" / "Gift Wrapped"), so Shopify sets the
 * price, including the +$1 for wrap.
 *
 * Same unconfigured/failure rules as lib/shopify/queries.ts: mock config
 * outside production, rethrow in production.
 */
import { isShopifyConfigured, shopifyFetch } from "@/lib/shopify/client";
import { isProductionRuntime } from "@/lib/env";
import { MOCK_GIFT_COMPONENT_PRODUCTS, MOCK_GIFT_SET_PRODUCTS, MOCK_PRODUCTS } from "@/lib/shopify/mock-data";
import type { Money } from "@/lib/shopify/types";
import { GIFT_COMPONENT_TAG, GIFT_SETS } from "./sets";

const GIFT_BUILDER_PRODUCT_QUERY = `#graphql
  query GiftBuilderProduct($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      description
      featuredImage { url altText width height }
      options { name optionValues { name } }
      variants(first: 20) {
        nodes {
          id
          title
          availableForSale
          price { amount currencyCode }
          selectedOptions { name value }
        }
      }
      bands: metafield(namespace: "gift_builder", key: "bands") {
        references(first: 50) {
          nodes {
            ... on Metaobject {
              id
              handle
              name: field(key: "name") { value }
              category: field(key: "category") { value }
              image: field(key: "image") {
                reference {
                  ... on MediaImage {
                    # Originals are ~1263×1505 PNGs — ask the CDN for a card-sized copy.
                    image { url(transform: { maxWidth: 600 }) altText width height }
                  }
                }
              }
            }
          }
        }
      }
      noteMax: metafield(namespace: "gift_builder", key: "note_max_length") { value }
      heroCtaLabel: metafield(namespace: "gift_builder", key: "hero_cta_label") { value }
      heroCtaOccasion: metafield(namespace: "gift_builder", key: "hero_cta_occasion") { value }
      flavors: metafield(namespace: "gift_builder", key: "flavors") {
        value
        references(first: 20) {
          nodes {
            ... on Product {
              id
              title
              handle
              tags
              featuredImage { url altText width height }
              variants(first: 1) { nodes { id sku availableForSale } }
              # The regular product this component stands for — its
              # description is shown on the flavor card. (The component's
              # own description is an internal note; never shown.)
              source: metafield(namespace: "gift_builder", key: "flavor_source") {
                reference { ... on Product { description } }
              }
            }
          }
        }
      }
      contents: metafield(namespace: "gift_builder", key: "contents") {
        value
        references(first: 10) {
          nodes {
            ... on ProductVariant { id sku title availableForSale product { title tags } }
          }
        }
      }
    }
  }
`;

export { GIFT_SETS, type GiftSetKey } from "./sets";

export const GIFT_WRAP_OPTION = "Gift Wrap";

type Image = { url: string; altText: string | null; width: number | null; height: number | null };

export type GiftBuilderVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  selectedOptions: { name: string; value: string }[];
};

export type GiftBand = {
  id: string;
  handle: string;
  name: string;
  category: string;
  image: Image | null;
};

/** A pickable flavor = a $0 "(Gift Set)" component product. */
export type GiftBuilderFlavor = {
  id: string;
  /** e.g. "Coffee & Cookies Bar (Gift Set)" — show via shortFlavorName(). */
  title: string;
  handle: string;
  featuredImage: Image | null;
  /** Shopper-facing description, from the regular product linked via the
   * component's `gift_builder.flavor_source` metafield. Null if unlinked. */
  description: string | null;
  /** The $0 component variant added to the cart for each bar of this flavor. */
  variantId: string;
  sku: string | null;
  availableForSale: boolean;
};

/** Fixed contents of a set (e.g. "Malört Caramels (Gift Set) / 4 Count", SKU F002). */
export type GiftBuilderComponent = {
  variantId: string;
  sku: string | null;
  /** Variant title, e.g. "4 Count". */
  title: string;
  productTitle: string;
  availableForSale: boolean;
  /** Leading number of the variant title, matched against the set size ("4 Caramels"). */
  count: number;
};

export type GiftBuilderConfig = {
  productId: string;
  title: string;
  handle: string;
  description: string;
  image: Image | null;
  /** First option = size ("Box Size" / "Count"); second = "Gift Wrap". */
  sizeOptionName: string;
  sizes: string[];
  wrapOptionName: string;
  variants: GiftBuilderVariant[];
  /** Bands in display order. */
  bands: GiftBand[];
  /** Occasion categories, in the order they first appear in `bands`. */
  bandCategories: string[];
  noteMaxLength: number;
  /** Flavors to pick from. Empty for fixed-content sets (e.g. Malört caramels). */
  flavors: GiftBuilderFlavor[];
  /** Fixed contents by size. Empty for pick-your-flavors sets. */
  fixedContents: GiftBuilderComponent[];
  /** Homepage hero button for this set, controlled from Shopify admin
   * (`gift_builder.hero_cta_label` / `hero_cta_occasion` product
   * metafields). `null` = no button — clear the label to turn it off. */
  heroCta: { label: string; occasion: string | null } | null;
};

type RawBand = {
  id?: string;
  handle?: string;
  name?: { value: string | null } | null;
  category?: { value: string | null } | null;
  image?: { reference: { image?: Image } | null } | null;
};

type RawFlavor =
  | {
      id: string;
      title: string;
      handle: string;
      tags: string[];
      featuredImage: Image | null;
      variants: { nodes: { id: string; sku: string | null; availableForSale: boolean }[] };
      source: { reference: { description?: string } | null } | null;
    }
  | Record<string, never>;

type RawComponent = {
  id?: string;
  sku?: string | null;
  title?: string;
  availableForSale?: boolean;
  product?: { title: string; tags: string[] };
};

type RawProduct = {
  id: string;
  title: string;
  handle: string;
  description: string;
  featuredImage: Image | null;
  options: { name: string; optionValues: { name: string }[] }[];
  variants: { nodes: GiftBuilderVariant[] };
  bands: { references: { nodes: RawBand[] } | null } | null;
  noteMax: { value: string } | null;
  heroCtaLabel: { value: string } | null;
  heroCtaOccasion: { value: string } | null;
  flavors: { value: string; references: { nodes: RawFlavor[] } | null } | null;
  contents: { value: string; references: { nodes: RawComponent[] } | null } | null;
};

const DEFAULT_NOTE_MAX = 150;

/** How many entries a list metafield holds, visible or not —
 * `references.nodes` silently omits anything the Storefront can't see
 * (Draft / unpublished), so count from the raw JSON list instead. */
function listedCount(field: { value: string } | null): number {
  try {
    const ids: unknown = JSON.parse(field?.value ?? "[]");
    return Array.isArray(ids) ? ids.length : 0;
  } catch {
    return 0;
  }
}

/** Only $0 component products may go into a set as contents. Anything
 * else listed in `flavors` / `contents` (e.g. the regular, priced bar
 * product) is ignored, so a mis-set metafield can't add a real-priced
 * line or a SKU-less set to the cart. */
const isGiftComponent = (tags: string[] | undefined) =>
  (tags ?? []).some((t) => t.toLowerCase() === GIFT_COMPONENT_TAG);

function toGiftBuilderConfig(p: RawProduct): GiftBuilderConfig | null {
  const sizeOpt = p.options.find((o) => o.name !== GIFT_WRAP_OPTION) ?? p.options[0];
  const bands: GiftBand[] = (p.bands?.references?.nodes ?? [])
    .filter((n) => n.id && n.name?.value)
    .map((n) => ({
      id: n.id!,
      handle: n.handle ?? "",
      name: n.name!.value!,
      category: n.category?.value?.trim() || "Other",
      image: n.image?.reference?.image ?? null,
    }));

  const flavors: GiftBuilderFlavor[] = (p.flavors?.references?.nodes ?? [])
    .filter((n): n is Exclude<RawFlavor, Record<string, never>> => "id" in n && n.variants.nodes.length > 0)
    .filter((n) => isGiftComponent(n.tags))
    .map((n) => ({
      id: n.id,
      title: n.title,
      handle: n.handle,
      featuredImage: n.featuredImage,
      description: n.source?.reference?.description?.trim() || null,
      variantId: n.variants.nodes[0].id,
      sku: n.variants.nodes[0].sku,
      availableForSale: n.variants.nodes[0].availableForSale,
    }));

  const fixedContents: GiftBuilderComponent[] = (p.contents?.references?.nodes ?? [])
    .filter((n) => n.id && isGiftComponent(n.product?.tags))
    .map((n) => ({
      variantId: n.id!,
      sku: n.sku ?? null,
      title: n.title ?? "",
      productTitle: n.product?.title ?? "",
      availableForSale: n.availableForSale ?? true,
      count: parseInt(n.title ?? "", 10) || 0,
    }));

  // Every set must put its contents on the order as real-SKU lines (they
  // feed inventory and reporting). If the metafields list contents but
  // none are usable (Draft/unpublished, or not tagged gift-component), or
  // list none at all, take the builder offline — the page 404s and its
  // links hide — rather than sell sets with no SKUs on the order.
  const problem =
    listedCount(p.flavors) > 0 && flavors.length === 0
      ? "gift_builder.flavors lists products, but none are visible gift-component products"
      : listedCount(p.contents) > 0 && fixedContents.length === 0
        ? "gift_builder.contents lists variants, but none are visible gift-component variants"
        : flavors.length === 0 && fixedContents.length === 0
          ? "neither gift_builder.flavors nor gift_builder.contents is set"
          : null;
  if (problem) {
    console.error(
      `[gift-builder] ${p.handle}: ${problem} (they must be Active, published to the Headless channel and tagged "${GIFT_COMPONENT_TAG}"). Builder disabled until fixed.`
    );
    return null;
  }

  return {
    productId: p.id,
    title: p.title,
    handle: p.handle,
    description: p.description,
    image: p.featuredImage,
    sizeOptionName: sizeOpt?.name ?? "",
    sizes: sizeOpt?.optionValues.map((v) => v.name) ?? [],
    wrapOptionName: GIFT_WRAP_OPTION,
    variants: p.variants.nodes,
    bands,
    bandCategories: [...new Set(bands.map((b) => b.category))],
    noteMaxLength: (p.noteMax && parseInt(p.noteMax.value, 10)) || DEFAULT_NOTE_MAX,
    heroCta: p.heroCtaLabel?.value.trim()
      ? { label: p.heroCtaLabel.value.trim(), occasion: p.heroCtaOccasion?.value.trim() || null }
      : null,
    flavors,
    fixedContents,
  };
}

/**
 * Builder config for one gift set product, or `null` if the product
 * doesn't exist on the Storefront (not created yet, still Draft, or not
 * published to the Headless channel) — the page 404s in that case.
 */
export async function getGiftBuilderConfig(handle: string): Promise<GiftBuilderConfig | null> {
  if (!isShopifyConfigured()) {
    if (isProductionRuntime()) {
      throw new Error("Shopify is not configured in production — can't load the gift builder.");
    }
    return getMockGiftBuilderConfig(handle);
  }

  try {
    const data = await shopifyFetch<{ product: RawProduct | null }>({
      query: GIFT_BUILDER_PRODUCT_QUERY,
      variables: { handle },
      // Short window: band designs and flavors get edited in admin and
      // should show up without a deploy. "products" matches the tag the
      // rest of the catalog uses for on-demand revalidation.
      revalidate: 300,
      tags: ["products", `gift-builder:${handle}`],
    });
    return data.product ? toGiftBuilderConfig(data.product) : null;
  } catch (error) {
    console.error(`[gift-builder] getGiftBuilderConfig(${handle}) failed:`, error);
    if (isProductionRuntime()) throw error;
    return getMockGiftBuilderConfig(handle);
  }
}

/* ------------------------------------------------------------------ */
/* Mock config — local dev / Preview without Shopify credentials        */
/* ------------------------------------------------------------------ */

const MOCK_BANDS: Array<[string, string]> = [
  ["Black & White Bow", "Any Occasion"],
  ["Merry Christmas", "Holiday"],
  ["Season's Treatings", "Holiday"],
  ["Have Your Cake", "Birthday"],
  ["Thanks a Bunch", "Thank You"],
];

function getMockGiftBuilderConfig(handle: string): GiftBuilderConfig | null {
  const product = MOCK_GIFT_SET_PRODUCTS.find((p) => p.handle === handle);
  if (!product) return null;
  const sizeOptionName = product.variants[0].selectedOptions[0].name;
  const bands: GiftBand[] = MOCK_BANDS.map(([name, category], i) => ({
    id: `gid://mock/Metaobject/${i + 1}`,
    handle: name.toLowerCase().replace(/[^a-z]+/g, "-"),
    name,
    category,
    // One band left without an image on purpose, to exercise the
    // placeholder card the real store shows until a photo is uploaded.
    image:
      i === 0
        ? null
        : {
            url: `https://placehold.co/800x600/25382A/E8BC5C.png?text=${encodeURIComponent(name)}`,
            altText: `${name} band`,
            width: 800,
            height: 600,
          },
  }));
  return {
    productId: product.id,
    title: product.title,
    handle: product.handle,
    description: product.description,
    image: product.images[0] ? { ...product.images[0], width: 1000, height: 1000 } : null,
    sizeOptionName,
    sizes: [...new Set(product.variants.map((v) => v.selectedOptions[0].value))],
    wrapOptionName: GIFT_WRAP_OPTION,
    variants: product.variants,
    bands,
    bandCategories: [...new Set(bands.map((b) => b.category))],
    noteMaxLength: DEFAULT_NOTE_MAX,
    heroCta: handle === GIFT_SETS.bars ? { label: "Get in on the good stuff", occasion: "Holiday" } : null,
    flavors:
      handle === GIFT_SETS.bars
        ? MOCK_GIFT_COMPONENT_PRODUCTS.filter((p) => p.title.endsWith("Bar (Gift Set)")).map((p) => ({
            id: p.id,
            title: p.title,
            handle: p.handle,
            featuredImage: p.images[0]
              ? { url: p.images[0].url, altText: p.images[0].altText, width: 1000, height: 1000 }
              : null,
            description:
              MOCK_PRODUCTS.find((bar) => `${bar.title} Bar (Gift Set)` === p.title)?.description ?? null,
            variantId: p.variants[0].id,
            sku: (p.variants[0] as { sku?: string }).sku ?? null,
            availableForSale: true,
          }))
        : [],
    fixedContents:
      handle === GIFT_SETS.caramels
        ? (MOCK_GIFT_COMPONENT_PRODUCTS.find((p) => p.handle === "malort-caramels-gift-set")?.variants ?? []).map((v) => ({
            variantId: v.id,
            sku: (v as { sku?: string }).sku ?? null,
            title: v.title,
            productTitle: "Malört Caramels (Gift Set)",
            availableForSale: true,
            count: parseInt(v.title, 10) || 0,
          }))
        : [],
  };
}
