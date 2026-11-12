import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { Product, ProductVariant } from "@/lib/shopify/types";
import { JsonLd } from "./JsonLd";
import { ORGANIZATION_ID } from "./OrganizationJsonLd";

/** Product structured data for a PDP. Every variant gets its own Offer
 * (name, SKU, price, availability) rather than one AggregateOffer —
 * Google's merchant listings need a concrete price per offer, and a
 * price range alone doesn't qualify. */
export function ProductJsonLd({ product }: { product: Product }) {
  const url = `${SITE_URL}/shop/${product.handle}`;
  const images = product.images.map((image) => image.url);

  const toOffer = (variant: ProductVariant) => ({
    "@type": "Offer",
    url,
    // "Default Title" is Shopify's placeholder for a product with no options.
    ...(variant.title && variant.title !== "Default Title" ? { name: variant.title } : {}),
    ...(variant.sku ? { sku: variant.sku } : {}),
    priceCurrency: variant.price.currencyCode,
    price: variant.price.amount,
    availability: variant.availableForSale
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": ORGANIZATION_ID },
  });

  const offers = product.variants.map(toOffer);
  const firstSku = product.variants.find((v) => v.sku)?.sku;

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.title,
    description: product.description,
    url,
    image: images,
    ...(firstSku ? { sku: firstSku } : {}),
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(offers.length === 1 ? { offers: offers[0] } : offers.length > 1 ? { offers } : {}),
  };

  return <JsonLd data={data} />;
}
