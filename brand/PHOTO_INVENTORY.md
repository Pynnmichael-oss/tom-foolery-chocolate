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

Started as homepage `StorySection`/section placements (`src/app/page.tsx`)
— two of the three have since moved on to other pages, tracked here
since this table is these files' "current primary placement," not
strictly homepage-only anymore:

| File | Resolution | PDF origin | Placement | Notes |
|---|---|---|---|---|
| `heritage-founding-family.jpg` | 847×703 | live site, not PDF | Heritage story (juniper bg, text-left) | Swapped in 2026-09-15 for `heritage-friends-sharing-chocolate.jpg` below — same real black-and-white photo as `/story`'s `HeritageBeat`; see its own table entry lower down for provenance. Wrapper uses `aspect-[847/703]` (the photo's native ratio) instead of the old slot's 4:5, so nothing crops. |
| `philosophy-live-a-little.jpg` | 2033×1146 | p.48, img 40 | `/gifting`'s `GiftingHero` (2026-09-17) — was the Philosophy `StorySection` before that, merged into `WhatWeBelieve` 2026-09-14 | Woman in sunglasses laughing, chocolate bar raised — pure "Live a Little" energy. Full-bleed hero use, per the resolution note below. |
| `craft-hazelnut-bar-flatlay.jpg` | 1241×2200 | p.11, img 9 | `/gifting`'s `GiftingPanels` ("Custom & Branded" panel, 2026-09-17) — was also the homepage Craft `StorySection` (merged into `WhatWeBelieve` 2026-09-14) and `/story`'s `HeritageBeat` scrapbook cluster (removed for good 2026-09-16) | Overhead flat-lay, broken hazelnut chocolate bar on a turmeric-yellow surface. |

`heritage-friends-sharing-chocolate.jpg` (1956×2200, p.7 img 2 — two friends,
eyes closed, laughing over a bite of chocolate) **no longer appears anywhere
on the site** as of 2026-09-15, replaced in its one remaining placement
(homepage Heritage) by `heritage-founding-family.jpg` above. Kept as a
backup.

## Also used on `/story` (`src/app/story/page.tsx`)

More of the backups below got pulled in for the Story page's closing
photo grid (`ClosingPhotoGrid`) — same files, new placements, no
re-processing:

| File | Placement | Notes |
|---|---|---|
| `raspberry-stacked-bars.jpg` | `ClosingPhotoGrid` | Newly wired. |
| `kid-chocolate-face-coral.jpg` | `ClosingPhotoGrid` | Newly wired. |
| `woman-eating-chocolate-pink.jpg` | `ClosingPhotoGrid` | Newly wired. |
| `citrus-filled-bar-green.jpg` | `ClosingPhotoGrid` | Newly wired. |

`heritage-friends-sharing-chocolate.jpg` (the "two friends laughing"
photo) **no longer appears anywhere on the site** as of 2026-09-15 — it
was `HeritageBeat`'s scrapbook-cluster placeholder standing in for a real
heritage/founder photo (replaced 2026-09-10, see the next section), and
its one remaining placement, the homepage Heritage `StorySection`, was
itself swapped to the same real photo on 2026-09-15 (see "Wired into the
site" above).

`craft-hazelnut-bar-flatlay.jpg` and `truffles-turmeric-background.jpg`
(the torn-edge "scrapbook" duo — bar + bonbons) were both unwired from
`/story` as of 2026-09-16 — they were `HeritageBeat`'s placeholder
standing in for real heritage photography, and stopped earning their
place there once the real family photo (`heritage-founding-family.jpg`)
was sourced. Briefly relocated to their own section near
`StoryClosingCta`'s shop CTA (2026-09-16) before being removed outright
from `/story` the same day. The `ScrapbookPhoto` component that rendered
them (torn/zigzag-edge `clip-path` treatment) was deleted too — nothing
else used it. Both re-wired the next day into `/gifting`'s
`GiftingPanels` instead (2026-09-17, see "Wired into the site" above and
"Also used on /gifting" below) — unrelated to their old `/story`
placement, just the most on-brand photography available for that page
while its own real shoot photos are still pending.

## Also used on `/gifting` (`src/app/gifting/page.tsx`)

Three photos placed 2026-09-17 building out the real Corporate Gifting
page (previously a `ComingSoonPage` placeholder). The brief pointed at a
Google Drive folder of real shoot photos for this page
(`Product Photos > JPG`/`PNG`, linked from the task) — Drive access
itself works fine, but as of 2026-09-17 both subfolders are genuinely
empty (folder structure only, confirmed via two separate searches, one
paginated to exhaustion, plus a permissions check to rule out an
access problem rather than an empty-folder one). These three are the
most on-brand photography available in the meantime, not new
photography:

| File | Placement | Notes |
|---|---|---|
| `philosophy-live-a-little.jpg` | `GiftingHero` | See "Wired into the site" above — full-bleed hero background. |
| `craft-hazelnut-bar-flatlay.jpg` | `GiftingPanels`, "Custom & Branded" panel | See "Wired into the site" above. |
| `truffles-turmeric-background.jpg` | `GiftingPanels`, "Weddings & Events" panel | Re-wired here from its old `/story` scrapbook-cluster placement (see above) — panel-card size, well within the resolution ceiling below. |

`citrus-filled-bar-green.jpg` (already wired into `/story`'s
`ClosingPhotoGrid`, see above) is now also used here, `GiftingPanels`'s
"Ready to Ship" panel — the first file used on two pages at once.
Deliberate, not a mistake: it's placeholder photography on both pages
either way, and the two pages aren't viewed side by side.
`TODO(garrett)` comments on `GiftingHero.tsx`/`GiftingPanels.tsx` mark
exactly where to swap in the real shoot photos once they land in that
Drive folder.

## Live-site-sourced (not from the brand guide PDF)

One `/story` image, pulled directly from the live production site rather
than this document's PDF-extraction pipeline — different provenance, so
tracked separately from everything above:

| File | Placement | Source | Notes |
|---|---|---|---|
| `heritage-founding-family.jpg` | `HeritageBeat` on `/story`, and (as of 2026-09-15) the homepage Heritage `StorySection` | `https://tomfoolerychocolate.com/cdn/shop/files/Screenshot_2026-08-02_211853.png?v=1786909732` (live homepage, fetched 2026-09-10) | Real black-and-white photo — five people with a cake inscribed "God Bless You, Bertha, Tommy and Mr. George." Already ran under the live production homepage's "three generations" line, so almost certainly the actual source photo, not placeholder photography — now also backing this codebase's own "3 Generations of Chocolate Legacy" homepage copy. Converted PNG→JPEG (fully opaque alpha). See the `TODO(garrett)` on `HERITAGE_PHOTO` in `HeritageBeat.tsx` — who's pictured/the occasion still needs confirming before it's asserted in copy. |

`malort-caramels-product.jpg` (Live Shopify Storefront API, `Malort
Caramels` product `featuredImage`,
`https://cdn.shopify.com/s/files/1/0992/9660/8574/files/Untitleddesign_6.png?v=1786911107`,
fetched 2026-09-10) briefly ran on `BrandCompass`'s "A Touch of Rebellion"
tenet panel as of 2026-09-10, but got pulled again the next day — at
that panel's small display size, the low-res (500×250, a quick render
rather than photographed packaging) candy shape read as an unclear blue
blob rather than an intentional mark, so `CompassPanel` went type-only
site-wide instead (see the `TODO(brand-assets)` in `BrandCompass.tsx`).
File's still in `public/photos/` in case a clearer treatment or a real
product shot make it worth another try.

## Kept as backups (not currently wired in)

| File | Resolution | PDF origin | Subject | Suggested use |
|---|---|---|---|---|
| `girl-sunglasses-chocolate-face.jpg` | 546×727 | p.51 grid, img 51 | Toddler in pink sunglasses, chocolate-smeared face, striped bg | Playful, on-voice — best at card/thumbnail size rather than full-bleed. Good candidate for a future PDP or content refresh. |

`craft-hazelnut-bar-flatlay.jpg` and `truffles-turmeric-background.jpg`
were briefly unwired (2026-09-16, listed here) before being re-wired
into `/gifting` the next day — see "Also used on /gifting" above; no
longer backups as of 2026-09-17.

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
