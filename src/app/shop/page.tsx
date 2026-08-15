import type { Metadata } from "next";
import { Preheader, Headline } from "@/components/ui/typography";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { POWER_STATEMENTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop",
  description: POWER_STATEMENTS.funTastesBetter,
  alternates: { canonical: "/shop" },
  openGraph: { title: "Shop", description: POWER_STATEMENTS.funTastesBetter },
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
