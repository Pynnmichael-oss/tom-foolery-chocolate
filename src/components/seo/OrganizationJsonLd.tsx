import { POWER_STATEMENTS, SITE_NAME, SITE_URL } from "@/lib/site";

/** Organization structured data, rendered once in the root layout.
 * `logo` intentionally points at a raster asset — see public/logos/README
 * (or the code comment in opengraph-image.tsx) for why a PNG survives
 * even after the on-page nav/footer marks moved to real SVG vectors. */
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logos/icon-positive.png`,
    description: POWER_STATEMENTS.chocolateInteresting,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
