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
import { MOCK_GIFT_SET_PRODUCTS, MOCK_PRODUCTS } from "@/lib/shopify/mock-data";
import type { Money } from "@/lib/shopify/types";
import { GIFT_SETS } from "./sets";

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
                  ... on MediaImage { image { url altText width height } }
                }
              }
            }
          }
        }
      }
      noteMax: metafield(namespace: "gift_builder", key: "note_max_length") { value }
      flavors: metafield(namespace: "gift_builder", key: "flavors") {
        references(first: 20) {
          nodes {
            ... on Product {
              id
              title
              handle
              availableForSale
              featuredImage { url altText width height }
            }
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

export type GiftBuilderFlavor = {
  id: string;
  title: string;
  handle: string;
  featuredImage: Image | null;
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
  /** Empty for sets with a single fixed flavor (e.g. Malört caramels). */
  flavors: GiftBuilderFlavor[];
};

type RawBand = {
  id?: string;
  handle?: string;
  name?: { value: string | null } | null;
  category?: { value: string | null } | null;
  image?: { reference: { image?: Image } | null } | null;
};

type RawFlavor = (GiftBuilderFlavor & { availableForSale: boolean }) | Record<string, never>;

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
  flavors: { references: { nodes: RawFlavor[] } | null } | null;
};

const DEFAULT_NOTE_MAX = 150;

function toGiftBuilderConfig(p: RawProduct): GiftBuilderConfig {
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
    // Unpublished/sold-out flavor products are left out rather than
    // offered and then rejected at checkout.
    flavors: (p.flavors?.references?.nodes ?? [])
      .filter((n): n is GiftBuilderFlavor & { availableForSale: boolean } => "id" in n && n.availableForSale)
      .map(({ id, title, handle, featuredImage }) => ({ id, title, handle, featuredImage })),
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
    flavors:
      handle === GIFT_SETS.bars
        ? MOCK_PRODUCTS.slice(0, 3).map((p) => ({
            id: p.id,
            title: p.title,
            handle: p.handle,
            featuredImage: p.images[0]
              ? { url: p.images[0].url, altText: p.images[0].altText, width: 1000, height: 1000 }
              : null,
          }))
        : [],
  };
}
