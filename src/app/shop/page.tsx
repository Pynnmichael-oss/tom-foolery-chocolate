import type { Metadata } from "next";
import { Preheader, Headline } from "@/components/ui/typography";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { DEFAULT_OG_IMAGE, POWER_STATEMENTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop",
  description: POWER_STATEMENTS.funTastesBetter,
  alternates: { canonical: "/shop" },
  // images: DEFAULT_OG_IMAGE — see that constant's own comment on why an
  // openGraph override needs this explicitly, not just title/description.
  openGraph: {
    title: "Shop",
    description: POWER_STATEMENTS.funTastesBetter,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function ShopPage() {
  return (
    <main id="main-content" className="px-fluid-md py-fluid-2xl">
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
