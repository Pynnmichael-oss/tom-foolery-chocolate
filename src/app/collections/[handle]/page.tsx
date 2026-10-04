import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollection, getCollectionHandles } from "@/lib/shopify/queries";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { ProductGridReveal } from "@/components/commerce/ProductGridReveal";

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

  return (
    <main id="main-content" className="px-fluid-md py-fluid-2xl">
      <div className="mx-auto max-w-6xl">
        <header className="mb-fluid-xl flex flex-col gap-fluid-sm">
          <Preheader>Gifting</Preheader>
          <Headline as="h1" size="md">
            {collection.title}
          </Headline>
          {collection.description && (
            <BodyText className="max-w-2xl text-fg/80">{collection.description}</BodyText>
          )}
        </header>

        {collection.products.length === 0 ? (
          <p className="font-sans text-fg/70">
            No products available right now — check back soon.
          </p>
        ) : (
          <ProductGridReveal products={collection.products} />
        )}
      </div>
    </main>
  );
}
