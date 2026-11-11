/** Renders one schema.org JSON-LD block. `<` is escaped so a `</script>`
 * inside merchant-authored text (a product description, say) can't close
 * the tag early. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
