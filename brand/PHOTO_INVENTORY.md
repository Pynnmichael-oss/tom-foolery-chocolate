# Photography Inventory

Source: every raster image embedded in `TomFoolery_Brand_Standards_August2026.pdf`,
extracted via `pdfimages -all` (52 files total). This document covers the
genuinely usable photography — real product/lifestyle photos, not
illustrations, type-treatment cards, or the five color-texture swatches
already documented in `BRAND_REFERENCE.md` §5.

All kept files were downscaled (longest edge capped at 2200px, JPEG quality
85) and renamed descriptively into `public/photos/`. Originals in the PDF
run up to 4810px on the long edge — full-bleed hero-grade resolution, more
than the site needs once `next/image` generates its responsive `srcset`.

## Wired into the site

These three are placed in the `media` slot of the three `StorySection`
blocks on the homepage (`src/app/page.tsx`), one per brand section:

| File | Resolution | PDF origin | Placement | Notes |
|---|---|---|---|---|
| `heritage-friends-sharing-chocolate.jpg` | 1956×2200 | p.7, img 2 | Heritage story (juniper bg, text-left) | Two friends, eyes closed, laughing over a bite of chocolate — genuine candid warmth, reads as "started between friends." |
| `philosophy-live-a-little.jpg` | 2033×1146 | p.48, img 40 | Philosophy story (white bg, text-right) | Woman in sunglasses laughing, chocolate bar raised — pure "Live a Little" energy. Wide negative space on the left keeps the crop breathable against white. |
| `craft-hazelnut-bar-flatlay.jpg` | 1241×2200 | p.11, img 9 | Craft story (turmeric bg, centered) | Overhead flat-lay, broken hazelnut chocolate bar on a turmeric-yellow surface — literal color match to the section background, ties directly to "hand-finished" craft copy. |

## Also used on `/story` (`src/app/story/page.tsx`)

Four more of the backups below got pulled in for the Story page's
scrapbook photo cluster (`HeritageBeat`) and closing photo grid
(`ClosingPhotoGrid`) — same files, new placements, no re-processing:

| File | Placement | Notes |
|---|---|---|
| `craft-hazelnut-bar-flatlay.jpg` | `HeritageBeat` scrapbook cluster | Reused from the homepage — still just the guide's own product photography, not real heritage/founder photos. |
| `truffles-turmeric-background.jpg` | `HeritageBeat` scrapbook cluster | Newly wired — previously a backup only. |
| `raspberry-stacked-bars.jpg` | `ClosingPhotoGrid` | Newly wired. |
| `kid-chocolate-face-coral.jpg` | `ClosingPhotoGrid` | Newly wired. |
| `woman-eating-chocolate-pink.jpg` | `ClosingPhotoGrid` | Newly wired. |
| `citrus-filled-bar-green.jpg` | `ClosingPhotoGrid` | Newly wired. |

`heritage-friends-sharing-chocolate.jpg` (the "two friends laughing"
photo above) **no longer appears on `/story`** as of 2026-09-10 — it was
`HeritageBeat`'s scrapbook-cluster placeholder standing in for a real
heritage/founder photo; see the next section for what replaced it. It's
still wired into the homepage's `StorySection` (table above) and
unaffected there — that placement was never a heritage-photo placeholder,
just this same product/lifestyle photography used for its own sake.

## Live-site-sourced (not from the brand guide PDF)

Two more `/story` images, pulled directly from the live production site
rather than this document's PDF-extraction pipeline — different
provenance, so tracked separately from everything above:

| File | Placement | Source | Notes |
|---|---|---|---|
| `heritage-founding-family.jpg` | `HeritageBeat`, replacing `heritage-friends-sharing-chocolate.jpg` | `https://tomfoolerychocolate.com/cdn/shop/files/Screenshot_2026-08-02_211853.png?v=1786909732` (live homepage, fetched 2026-09-10) | Real black-and-white photo — five people with a cake inscribed "God Bless You, Bertha, Tommy and Mr. George." Already running under the homepage's "three generations" line, so almost certainly the actual source photo, not placeholder photography. Converted PNG→JPEG (fully opaque alpha). See the `TODO(garrett)` on `HERITAGE_PHOTO` in `HeritageBeat.tsx` — who's pictured/the occasion still needs confirming before it's asserted in copy. |
| `malort-caramels-product.jpg` | `BrandCompass`'s "A Touch of Rebellion" tenet panel | Live Shopify Storefront API, `Malort Caramels` product `featuredImage` (`https://cdn.shopify.com/s/files/1/0992/9660/8574/files/Untitleddesign_6.png?v=1786911107`, fetched 2026-09-10) | Real live product, genuinely on-brand for that tenet (see the comment in `BrandCompass.tsx`), but the source image itself is a low-res (500×250) quick render, not photographed packaging — cropped tight to the candy here. Worth a real product shot once one exists. |

## Kept as backups (not currently wired in)

| File | Resolution | PDF origin | Subject | Suggested use |
|---|---|---|---|---|
| `girl-sunglasses-chocolate-face.jpg` | 546×727 | p.51 grid, img 51 | Toddler in pink sunglasses, chocolate-smeared face, striped bg | Playful, on-voice — best at card/thumbnail size rather than full-bleed. Good candidate for a future PDP or content refresh. |

**On resolution**: don't stretch the 546×727-sourced files
(`woman-eating-chocolate-pink`, `truffles-turmeric-background`,
`citrus-filled-bar-green`, `girl-sunglasses-chocolate-face`) across a
full-bleed section — they'll visibly soften past ~700–800px rendered
width (both `/story` placements above keep these at grid/thumbnail size,
within that ceiling). The three original homepage photos and
`raspberry-stacked-bars` / `kid-chocolate-face-coral` all have headroom
for full-bleed or large hero use.

## Discarded (reviewed, not kept)

Reviewed and rejected as not being genuine, reusable photography:

- **Illustrations / type-treatment cards** — "Movie Popcorn Bon Bons" card,
  "My advice? —Tom" quote card, "mischief & merriment" card, "Bon Bon. Good
  Good." card (all from the p.51 social grid and p.43–44). These are
  finished marketing composites with baked-in copy, not standalone photos.
- **Off-brand product photo** — a child eating an "Once Upon a Farm" snack
  pouch (p.51 grid). Wrong brand entirely, discarded outright.
- **Bon Bon Box mockup images** (p.44, 4 files) — turned out to be the same
  four fabric/paper color-texture swatches already catalogued in
  `BRAND_REFERENCE.md` §5, not new photography.
- **Grayscale texture graphic** (p.41) — not a photo, a background texture
  element for a different layout treatment.
- Several additional macro chocolate/truffle shots (pages 9, 13, 33, 43, 49,
  50) were reviewed and are close duplicates in subject/framing to the kept
  set above — skipped to avoid a redundant inventory rather than for any
  quality reason.

## Provenance note

Every kept file above still carries the down-sampling and JPEG re-encode
from this pipeline — they are the brand guide's own product/lifestyle
photography, not new photography, and not final assets. If final, full-
resolution photography arrives from the brand team, drop it into
`public/photos/` under the same filenames — no code changes needed beyond
swapping the file.
