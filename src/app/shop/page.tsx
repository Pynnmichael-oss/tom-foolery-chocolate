import type { Metadata } from "next";
import { Preheader, Headline } from "@/components/ui/typography";
import { ProductGrid } from "@/components/commerce/ProductGrid";

export const metadata: Metadata = {
  title: "Shop — Tom Foolery Chocolate",
  description: "Small-batch, slightly unhinged chocolate. Shop the full lineup.",
};

export default function ShopPage() {
  return (
    <main className="px-fluid-md py-fluid-2xl">
      <div className="mx-auto max-w-6xl">
        <header className="mb-fluid-xl flex flex-col gap-fluid-sm">
          <Preheader>The Lineup</Preheader>
          <Headline size="md">Chocolate, Handled Irresponsibly</Headline>
        </header>

        <ProductGrid />
      </div>
    </main>
  );
}
