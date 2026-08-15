# Raster logo remnants

Every on-page logo (Nav, Hero, Footer, CartDrawer) now renders as a real
vector via `src/components/ui/logos.tsx`, sourced from `public/brand/`.

These two PNGs survive on purpose, not as leftovers:

- `icon-negative.png` — read directly by `app/opengraph-image.tsx`. The OG
  image renderer (satori, via `next/og`) reliably composes plain raster
  `<img>` sources; nesting an SVG image inside it isn't a well-supported
  path, so the icon stays raster there.
- `icon-positive.png` — referenced by `components/seo/OrganizationJsonLd.tsx`
  as the `logo` field. Structured-data consumers (Google's rich-result
  tooling in particular) have a longer, more reliable track record with
  raster logo images than SVG.

If you regenerate these (e.g. once the real licensed vector assets land),
keep the filenames the same — no code changes needed.
