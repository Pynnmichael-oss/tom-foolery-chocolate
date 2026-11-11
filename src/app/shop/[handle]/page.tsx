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

export async function generateMetadata(
  props: PageProps<"/shop/[handle]">
): Promise<Metadata> {
  const { handle } = await props.params;
  const product = await getProduct(handle);

  if (!product) {
    return { title: "Product Not Found", robots: { index: false, follow: true } };
  }

  // Product-specific description first (unique per page, good SEO
  // practice) with a short brand-voice flourish appended — not a full
  // power statement repeated verbatim on every PDP, which would read as
  // duplicate content across the catalog. Trailing punctuation is
  // stripped from the description before joining so this never produces
  // "...cookies Live a Little." (missing separator) or "...cookies.. Live
  // a Little." (doubled) depending on whether the source description
  // happens to end in a period.
  const trimmedDescription = product.description.trim().replace(/[.!?]+$/, "");
  const description = `${trimmedDescription}. ${POWER_STATEMENTS.liveALittle}.`.slice(0, 160);

  const image = product.images[0];
  // Social cards don't need the ~3000px original — see shopifyImageAtWidth.
  const shareImage = image ? shopifyImageAtWidth(image, 1200) : undefined;

  return {
    title: product.title,
    description,
    alternates: { canonical: `/shop/${handle}` },
    openGraph: {
      ...BASE_OPEN_GRAPH,
      url: `/shop/${handle}`,
      title: product.title,
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
