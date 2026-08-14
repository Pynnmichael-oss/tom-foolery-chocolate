import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/shopify/queries";
import { ProductDetail } from "@/components/commerce/ProductDetail";

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
    return { title: "Product Not Found — Tom Foolery Chocolate" };
  }

  return {
    title: `${product.title} — Tom Foolery Chocolate`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage(props: PageProps<"/shop/[handle]">) {
  const { handle } = await props.params;
  const product = await getProduct(handle);

  if (!product) notFound();

  return <ProductDetail product={product} />;
}
