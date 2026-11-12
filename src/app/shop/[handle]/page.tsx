import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { giftSetKeyForHandle } from "@/lib/gift-builder/sets";
import { getProduct, getProducts } from "@/lib/shopify/queries";
import { ProductDetail } from "@/components/commerce/ProductDetail";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { shopifyImageAtWidth } from "@/lib/shopify/format";
import { BASE_OPEN_GRAPH, POWER_STATEMENTS } from "@/lib/site";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ handle: product.handle }));
}

const DESCRIPTION_MAX = 155;

/**
 * Meta description for a product with no SEO description in Shopify: the
 * product's own description plus a short brand-voice flourish (not a full
 * power statement on every PDP, which would read as duplicate content
 * across the catalog). A description too long to fit is cut at the last
 * whole word at or before 155 characters and ends in "…" — never
 * mid-word, never on a trailing space.
 */
function fallbackDescription(raw: string): string {
  // `description` is Shopify's plain-text field, but strip any stray tags
  // and collapse whitespace so nothing odd reaches the meta tag.
  const text = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const withFlourish = `${text.replace(/[.!?]+$/, "")}. ${POWER_STATEMENTS.liveALittle}.`;
  if (!text) return `${POWER_STATEMENTS.liveALittle}.`;
  if (withFlourish.length <= DESCRIPTION_MAX) return withFlourish;
  if (text.length <= DESCRIPTION_MAX) return text;

  const clipped = text.slice(0, DESCRIPTION_MAX + 1);
  const lastSpace = clipped.lastIndexOf(" ");
  const cut = (lastSpace > 0 ? clipped.slice(0, lastSpace) : text.slice(0, DESCRIPTION_MAX))
    .replace(/[\s.,;:!?(–—-]+$/, "");
  return `${cut}…`;
}

export async function generateMetadata(
  props: PageProps<"/shop/[handle]">
): Promise<Metadata> {
  const { handle } = await props.params;
  const product = await getProduct(handle);

  if (!product) {
    return { title: "Product Not Found", robots: { index: false, follow: true } };
  }

  // Shopify's "Search engine listing" fields win when the merchant has
  // written them. The SEO title is used exactly as written (`absolute`
  // skips the root layout's "— Tom Foolery Chocolate" template): those
  // titles are already sized to what a search result shows.
  const seoTitle = product.seo?.title;
  const title = seoTitle ? { absolute: seoTitle } : product.title;
  const shareTitle = seoTitle ?? product.title;
  const description = product.seo?.description || fallbackDescription(product.description);

  const image = product.images[0];
  // Social cards don't need the ~3000px original — see shopifyImageAtWidth.
  const shareImage = image ? shopifyImageAtWidth(image, 1200) : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/shop/${handle}` },
    openGraph: {
      ...BASE_OPEN_GRAPH,
      url: `/shop/${handle}`,
      title: shareTitle,
      description,
      images:
        image && shareImage
          ? [{ ...shareImage, alt: image.altText || product.title }]
          : undefined,
    },
  };
}

export default async function ProductPage(props: PageProps<"/shop/[handle]">) {
  const { handle } = await props.params;

  // Gift sets are only purchasable through the builder — a plain PDP
  // would let them be bought with no flavors/band on the order.
  const giftSet = giftSetKeyForHandle(handle);
  if (giftSet) redirect(`/gifts/build?set=${giftSet}`);

  const product = await getProduct(handle);

  if (!product) notFound();

  return (
    <>
      <ProductJsonLd product={product} />
      <BreadcrumbJsonLd
        crumbs={[
          { name: "Shop", path: "/shop" },
          { name: product.title, path: `/shop/${product.handle}` },
        ]}
      />
      <ProductDetail product={product} />
    </>
  );
}
