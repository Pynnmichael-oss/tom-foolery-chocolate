import type { Metadata } from "next";
import { Preheader, Headline } from "@/components/ui/typography";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { BASE_OPEN_GRAPH, DEFAULT_OG_IMAGE } from "@/lib/site";

const TITLE = "Shop Chocolate Bars, Caramels & Gift Sets";
const DESCRIPTION =
  "Shop Tom Foolery's small-batch chocolate bars, Malört caramels and sampler packs, handcrafted in Chicago. A little fun always tastes better.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/shop" },
  // images: DEFAULT_OG_IMAGE — see that constant's own comment on why an
  // openGraph override needs this explicitly, not just title/description.
  openGraph: {
    ...BASE_OPEN_GRAPH,
    url: "/shop",
    title: TITLE,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function ShopPage() {
  return (
    <main id="main-content" className="px-fluid-md py-fluid-2xl">
      <BreadcrumbJsonLd crumbs={[{ name: "Shop", path: "/shop" }]} />
      <div className="mx-auto max-w-6xl">
        <header className="mb-fluid-xl flex flex-col gap-fluid-sm">
          <Preheader>The Lineup</Preheader>
          <Headline as="h1" size="md">
            Chocolate, Handled Irresponsibly
          </Headline>
        </header>

        <ProductGrid />
      </div>
    </main>
  );
}
