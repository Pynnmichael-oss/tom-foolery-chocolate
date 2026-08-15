import { SITE_URL } from "@/lib/site";
import type { Product } from "@/lib/shopify/types";

/** Product structured data for a PDP. Single-variant products get a plain
 * Offer; multi-variant products get an AggregateOffer summarizing the
 * price range, since each variant isn't a separately-crawlable page. */
export function ProductJsonLd({ product }: { product: Product }) {
  const url = `${SITE_URL}/shop/${product.handle}`;
  const images = product.images.map((image) => image.url);
  const anyAvailable = product.variants.some((v) => v.availableForSale);
  const availability = anyAvailable
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  const offers =
    product.variants.length <= 1
      ? {
          "@type": "Offer",
          url,
          priceCurrency: product.priceRange.min.currencyCode,
          price: product.priceRange.min.amount,
          availability,
        }
      : {
          "@type": "AggregateOffer",
          url,
          priceCurrency: product.priceRange.min.currencyCode,
          lowPrice: product.priceRange.min.amount,
          highPrice: product.priceRange.max.amount,
          offerCount: product.variants.length,
          availability,
        };

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: images,
    offers,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
