import { SITE_URL } from "@/lib/site";
import { JsonLd } from "./JsonLd";

export interface Crumb {
  name: string;
  /** Site-relative path, e.g. "/shop". */
  path: string;
}

/** BreadcrumbList structured data. "Home" is prepended automatically. */
export function BreadcrumbJsonLd({ crumbs }: { crumbs: Crumb[] }) {
  const all: Crumb[] = [{ name: "Home", path: "/" }, ...crumbs];

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: all.map((crumb, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: crumb.name,
          item: `${SITE_URL}${crumb.path === "/" ? "" : crumb.path}`,
        })),
      }}
    />
  );
}
