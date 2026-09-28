import { Preheader, Headline } from "@/components/ui/typography";
import type { ShopPolicy } from "@/lib/shopify/types";

/**
 * Shared shell for the four Shopify-hosted policy pages (/privacy,
 * /returns, /shipping, /terms — see each route's own `page.tsx`, which
 * fetches its one policy via `getShopPolicies()` and calls `notFound()`
 * if the merchant hasn't filled it in yet, rather than rendering this
 * with nothing to show).
 *
 * Deliberately plain — same "static and light, on purpose" register
 * `ComingSoonPage` uses for the other footer utility pages: policy text
 * is dense and legal, not a place for brand flourish or motion.
 */
export function PolicyPage({ policy }: { policy: ShopPolicy }) {
  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-[70ch] flex-col gap-fluid-lg px-fluid-md py-fluid-2xl"
    >
      <div className="flex flex-col gap-fluid-sm">
        <Preheader className="text-fg/60">Policies</Preheader>
        <Headline as="h1" size="md">
          {policy.title}
        </Headline>
      </div>

      {/* Merchant-authored rich text from the Shopify admin's own policy
       * editor (Settings → Policies) — same trust level as
       * `Product.descriptionHtml` elsewhere in this app, never
       * user-submitted content. The heading/list/link styling below is
       * scoped to this one block via arbitrary-variant selectors rather
       * than global `prose`-style CSS, since nothing else in the app
       * renders raw Shopify HTML. */}
      <div
        className="flex flex-col gap-fluid-md font-sans text-fg/85 [&_h2]:mt-fluid-sm [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-fg [&_li]:ml-fluid-lg [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-fluid-xs [&_a]:text-tf-cinnamon-strong [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:no-underline"
        dangerouslySetInnerHTML={{ __html: policy.bodyHtml }}
      />
    </main>
  );
}
