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

## Kept as backups (not currently wired in)

Genuinely usable, but there were only three `media` slots on the homepage
today. Good candidates for a future PDP background, About page, or content
refresh — pull any of these into a `StorySection`, hero variant, or PDP
`media` slot the same way as the three above.

| File | Resolution | PDF origin | Subject | Suggested use |
|---|---|---|---|---|
| `raspberry-stacked-bars.jpg` | 2200×1235 | p.5, img 1 | Stacked dark chocolate bars, raspberry filling bleeding down the stack, pink bg | Full-bleed banner or PDP hero background — very wide, plenty of negative space. |
| `kid-chocolate-face-coral.jpg` | 2200×1240 | p.20, img 12 | Kid grinning with chocolate smeared on face, coral/orange bg | Playful accent block; negative space on the left fits an overlaid quote or power statement. |
| `woman-eating-chocolate-pink.jpg` | 546×727 | p.51 grid, img 44 | Woman biting into a chocolate square, pink bg, gold jewelry | Smaller crop from the social-grid page — usable at moderate size (card, PDP thumbnail rail), too soft to stretch full-bleed above ~700px wide. |
| `truffles-turmeric-background.jpg` | 545×727 | p.51 grid, img 46 | Five bonbons arranged vertically on turmeric-orange bg | Same social-grid resolution ceiling as above — good for a smaller Craft-section accent or PDP thumbnail, not a full-bleed hero. |
| `citrus-filled-bar-green.jpg` | 546×727 | p.51 grid, img 50 | Chocolate bar broken open, citrus-marmalade filling, green bg | Same resolution ceiling — pairs well with the juniper token if a smaller accent is ever needed there. |
| `girl-sunglasses-chocolate-face.jpg` | 546×727 | p.51 grid, img 51 | Toddler in pink sunglasses, chocolate-smeared face, striped bg | Same resolution ceiling — playful, on-voice, best at card/thumbnail size rather than full-bleed. |

**On resolution**: the six backups above are plenty sharp for anything up
to roughly card or half-width-column size. Don't stretch the four
546×727-sourced files (`woman-eating-chocolate-pink`,
`truffles-turmeric-background`, `citrus-filled-bar-green`,
`girl-sunglasses-chocolate-face`) across a full-bleed section — they'll
visibly soften past ~700–800px rendered width. The three wired-in photos
and `raspberry-stacked-bars` / `kid-chocolate-face-coral` all have headroom
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
