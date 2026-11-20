import { SITE_URL } from "@/lib/site";
import type { Collection } from "@/lib/shopify/types";
import { JsonLd } from "./JsonLd";

/** CollectionPage + ItemList structured data for /collections/[handle] —
 * tells a crawler which product pages the collection groups, in order. */
export function CollectionJsonLd({ collection }: { collection: Collection }) {
  const url = `${SITE_URL}/collections/${collection.handle}`;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": url,
        name: collection.title,
        url,
        ...(collection.description ? { description: collection.description } : {}),
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: collection.products.length,
          itemListElement: collection.products.map((product, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: product.title,
            url: `${SITE_URL}/shop/${product.handle}`,
          })),
        },
      }}
    />
  );
}
