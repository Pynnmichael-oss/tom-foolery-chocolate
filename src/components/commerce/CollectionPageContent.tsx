import Link from "next/link";
import { CollectionHeaderBand } from "@/components/sections/CollectionHeaderBand";
import { CollectionCustomGiftBand } from "@/components/sections/CollectionCustomGiftBand";
import { CollectionProductSection } from "./CollectionProductSection";
import type { Collection } from "@/lib/shopify/types";

/** Full /collections/[handle] page body: rose header band, product
 * layout (count-dependent — see CollectionProductSection), "Make it
 * custom" band, and a plain link back to the full catalog. One
 * `<main id="main-content">` wraps all of it, matching every other
 * page's pattern (MobileNav's inert-background toggle finds it by that
 * id). */
export function CollectionPageContent({ collection }: { collection: Collection }) {
  return (
    <main id="main-content">
      <CollectionHeaderBand title={collection.title} description={collection.description} />

      <div className="px-fluid-md py-fluid-2xl">
        <div className="mx-auto max-w-6xl">
          <CollectionProductSection products={collection.products} />
        </div>
      </div>

      <CollectionCustomGiftBand />

      <div className="px-fluid-md py-fluid-xl text-center">
        <Link
          href="/shop"
          className="font-sans text-sm font-black uppercase tracking-[0.075em] text-fg underline decoration-2 underline-offset-4 transition-colors hover:text-tf-cinnamon-strong"
        >
          Shop all chocolate →
        </Link>
      </div>
    </main>
  );
}
