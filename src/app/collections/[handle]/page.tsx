import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollection, getCollectionHandles } from "@/lib/shopify/queries";
import { CollectionPageContent } from "@/components/commerce/CollectionPageContent";

export async function generateStaticParams() {
  const handles = await getCollectionHandles();
  return handles.map((handle) => ({ handle }));
}

export async function generateMetadata(
  props: PageProps<"/collections/[handle]">
): Promise<Metadata> {
  const { handle } = await props.params;
  const collection = await getCollection(handle);

  if (!collection) {
    return { title: "Collection Not Found" };
  }

  const description = collection.description.slice(0, 160);

  return {
    title: collection.title,
    description,
    alternates: { canonical: `/collections/${handle}` },
    openGraph: { title: collection.title, description },
  };
}

export default async function CollectionPage(props: PageProps<"/collections/[handle]">) {
  const { handle } = await props.params;
  const collection = await getCollection(handle);

  if (!collection) notFound();

  return <CollectionPageContent collection={collection} />;
}
