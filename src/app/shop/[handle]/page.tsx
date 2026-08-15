import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/shopify/queries";
import { ProductDetail } from "@/components/commerce/ProductDetail";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { POWER_STATEMENTS } from "@/lib/site";

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
    return { title: "Product Not Found" };
  }

  // Product-specific description first (unique per page, good SEO
  // practice) with a short brand-voice flourish appended — not a full
  // power statement repeated verbatim on every PDP, which would read as
  // duplicate content across the catalog.
  const description = `${product.description} ${POWER_STATEMENTS.liveALittle}.`.slice(
    0,
    160
  );

  const image = product.images[0];

  return {
    title: product.title,
    description,
    alternates: { canonical: `/shop/${handle}` },
    openGraph: {
      title: product.title,
      description,
      images: image
        ? [{ url: image.url, width: image.width, height: image.height, alt: image.altText ?? product.title }]
        : undefined,
    },
  };
}

export default async function ProductPage(props: PageProps<"/shop/[handle]">) {
  const { handle } = await props.params;
  const product = await getProduct(handle);

  if (!product) notFound();

  return (
    <>
      <ProductJsonLd product={product} />
      <ProductDetail product={product} />
    </>
  );
}
