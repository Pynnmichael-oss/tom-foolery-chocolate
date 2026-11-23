/**
 * Collapsed "Ingredients" disclosure for the PDP, from the product's
 * `custom.ingredients` metafield. A native <details> so it works without
 * JS, is keyboard/screen-reader friendly, and stays indexable while
 * closed. Renders nothing when the metafield is empty.
 */
export function ProductIngredients({ ingredients }: { ingredients?: string | null }) {
  if (!ingredients) return null;

  return (
    <details className="group border-y border-tf-black/15">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 font-sans text-sm font-black text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon [&::-webkit-details-marker]:hidden">
        Ingredients
        <span aria-hidden="true" className="group-open:hidden">
          +
        </span>
        <span aria-hidden="true" className="hidden group-open:inline">
          &ndash;
        </span>
      </summary>
      <p className="whitespace-pre-line pb-4 font-sans text-sm leading-relaxed text-fg/70">
        {ingredients}
      </p>
    </details>
  );
}
