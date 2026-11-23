import type { ReactNode } from "react";

/**
 * Collapsed "Ingredients" disclosure for the PDP, from the product's
 * `custom.ingredients` metafield. A native <details> so it works without
 * JS, is keyboard/screen-reader friendly, and stays indexable while
 * closed. Renders nothing when the metafield is empty.
 *
 * The metafield is plain multi-line text, with a little light formatting
 * so multi-item products (the sampler) don't read as one wall of text:
 *  - A blank line starts a new paragraph.
 *  - A paragraph that opens with a short label and a colon
 *    ("Wild Cherry Bar: Dark Chocolate (...)") gets the label in bold.
 *    The label can't contain parentheses, so a colon deep inside an
 *    ingredient list ("contains 2% or less of:") is left alone.
 *  - Lines starting with "- " or "• " become a bulleted list.
 *  - **double asterisks** make text bold anywhere.
 */
export function ProductIngredients({ ingredients }: { ingredients?: string | null }) {
  if (!ingredients) return null;

  const blocks = ingredients
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

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
      <div className="flex flex-col gap-3 pb-4 font-sans text-sm leading-relaxed text-fg/70">
        {blocks.map((block, i) => (
          <IngredientBlock key={i} block={block} />
        ))}
      </div>
    </details>
  );
}

const BULLET = /^\s*[-•]\s+/;
const LABEL = /^([^:()\n]{1,60}):\s+/;

function IngredientBlock({ block }: { block: string }) {
  const lines = block.split("\n");

  if (lines.every((line) => BULLET.test(line))) {
    return (
      <ul className="list-disc space-y-1 pl-5">
        {lines.map((line, i) => (
          <li key={i}>{inline(line.replace(BULLET, ""))}</li>
        ))}
      </ul>
    );
  }

  const label = LABEL.exec(block);
  if (label) {
    return (
      <p className="whitespace-pre-line">
        <strong className="font-black text-fg">{label[1]}:</strong>{" "}
        {inline(block.slice(label[0].length))}
      </p>
    );
  }

  return <p className="whitespace-pre-line">{inline(block)}</p>;
}

/** `**bold**` → <strong>; everything else as plain text. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-black text-fg">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}
