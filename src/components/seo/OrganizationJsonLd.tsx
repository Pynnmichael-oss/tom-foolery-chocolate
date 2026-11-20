import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { SOCIAL_LINKS } from "@/lib/social-links";
import { JsonLd } from "./JsonLd";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/** Organization + WebSite structured data, rendered once in the root layout.
 * `logo` intentionally points at a raster asset — see public/logos/README
 * (or the code comment in opengraph-image.tsx) for why a PNG survives
 * even after the on-page nav/footer marks moved to real SVG vectors.
 * `sameAs` follows lib/social-links.ts, so adding a profile there is
 * enough to tie it to the brand here too. */
export function OrganizationJsonLd() {
  const sameAs = SOCIAL_LINKS.map((social) => social.href).filter(Boolean);

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: SITE_NAME,
        alternateName: ["Tom Foolery", "Tom Foolery Chocolates"],
        url: SITE_URL,
        logo: `${SITE_URL}/logos/icon-positive.png`,
        description: SITE_DESCRIPTION,
        slogan: "Live a Little",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Chicago",
          addressRegion: "IL",
          addressCountry: "US",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          url: `${SITE_URL}/contact`,
        },
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        publisher: { "@id": ORGANIZATION_ID },
        inLanguage: "en-US",
      },
    ],
  };

  return <JsonLd data={data} />;
}
