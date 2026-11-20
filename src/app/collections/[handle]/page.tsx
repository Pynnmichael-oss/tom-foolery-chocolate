import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getCollection, getCollectionHandles } from "@/lib/shopify/queries";
import { isHiddenCollection } from "@/lib/shopify/collections";
import { shopifyImageAtWidth } from "@/lib/shopify/format";
import { CollectionPageContent } from "@/components/commerce/CollectionPageContent";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { CollectionJsonLd } from "@/components/seo/CollectionJsonLd";
import { BASE_OPEN_GRAPH, DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/site";

export async function generateStaticParams() {
  const handles = await getCollectionHandles();
  return handles.map((handle) => ({ handle }));
}

export async function generateMetadata(
  props: PageProps<"/collections/[handle]">
): Promise<Metadata> {
  const { handle } = await props.params;
  const collection = isHiddenCollection(handle) ? null : await getCollection(handle);

  if (!collection) {
    return { title: "Collection Not Found", robots: { index: false, follow: true } };
  }

  // Most collections have no description in Shopify yet — fall back to a
  // plain one rather than shipping the page with no meta description.
  const description = (
    collection.description.trim() ||
    `Shop ${collection.title} from ${SITE_NAME}: small-batch chocolate handcrafted in Chicago.`
  ).slice(0, 160);

  // An openGraph override drops the inherited site image (see
  // DEFAULT_OG_IMAGE) — use the collection's first product photo, or the
  // site card when it has none.
  const image = collection.products[0]?.images[0];
  const images = image
    ? [{ ...shopifyImageAtWidth(image, 1200), alt: image.altText || collection.title }]
    : [DEFAULT_OG_IMAGE];

  return {
    title: collection.title,
    description,
    alternates: { canonical: `/collections/${handle}` },
    openGraph: {
      ...BASE_OPEN_GRAPH,
      url: `/collections/${handle}`,
      title: collection.title,
      description,
      images,
    },
  };
}

export default async function CollectionPage(props: PageProps<"/collections/[handle]">) {
  const { handle } = await props.params;

  // Admin/app plumbing collections aren't pages — see
  // lib/shopify/collections.ts. The old theme's redirect script still
  // forwards /collections/:handle here, so send them somewhere useful.
  if (isHiddenCollection(handle)) permanentRedirect("/shop");

  const collection = await getCollection(handle);

  if (!collection) notFound();

  return (
    <>
      <CollectionJsonLd collection={collection} />
      <BreadcrumbJsonLd
        crumbs={[
          { name: "Shop", path: "/shop" },
          { name: collection.title, path: `/collections/${collection.handle}` },
        ]}
      />
      <CollectionPageContent collection={collection} />
    </>
  );
}
