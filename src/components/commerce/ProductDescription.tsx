import { BodyText } from "@/components/ui/typography";
import type { Product } from "@/lib/shopify/types";

/**
 * Product description as formatted in the Shopify admin's rich-text
 * editor (`descriptionHtml`): paragraphs, bold/italic, bulleted and
 * numbered lists, links. The plain `description` field strips all of
 * that — paragraphs run together ("bits).Choose") and list items merge
 * into one sentence.
 *
 * Merchant-authored HTML from the Shopify admin — same trust level as
 * PolicyPage's `bodyHtml`, never user-submitted content. Sized like
 * BodyText (md) but a <div>, since the HTML brings its own <p>s. Falls
 * back to the plain text when there's no HTML.
 */
export function ProductDescription({
  product,
  className = "",
}: {
  product: Pick<Product, "description" | "descriptionHtml">;
  className?: string;
}) {
  if (!product.descriptionHtml?.trim()) {
    return <BodyText className={`text-fg/80 ${className}`}>{product.description}</BodyText>;
  }

  return (
    <div
      className={`flex flex-col gap-fluid-sm font-sans font-normal text-fg/80 [&_a]:text-tf-cinnamon-strong [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:no-underline [&_li]:pl-1 [&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-1 [&_ol]:pl-6 [&_strong]:font-black [&_strong]:text-fg [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:pl-6 ${className}`}
      style={{ fontSize: "var(--fs-body)", lineHeight: "calc(1em + 10.67px)" }}
      dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
    />
  );
}
