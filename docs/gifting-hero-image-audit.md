# Gifting Hero — Image Audit (2026-09-28)

Reference for the eventual swap-in at `GiftingHero.tsx`'s `DEFAULT_DESKTOP_IMAGE`
/ `DEFAULT_MOBILE_IMAGE` (see that file's own TODO). This file doesn't
change the hero itself — it's just the research behind that swap point,
done once so it doesn't need re-doing later.

## Current state

`GiftingHero.tsx` renders `/photos/philosophy-live-a-little.jpg`
(2033×1146, 108 KB) via `next/image` with `fill`, `priority` (it's the
page's LCP element), `quality={85}`, `sizes="100vw"`, and a hand-tuned
`object-position: 78% 22%` (see that file's comment — default center-crop
was cutting the subject almost entirely out of frame on mobile). No
mobile-specific source — the exact same file and crop render at every
breakpoint. Its own resolution (2033px) is under the ~2400px floor a
full-bleed desktop hero needs; see the file's own TODO for the full
investigation (confirmed this is the source's real ceiling, not a
downscale artifact — no higher-res version exists anywhere in the repo).

## `/public/photos` — full inventory

| File | Dimensions | Size | Note |
|---|---|---|---|
| `philosophy-live-a-little.jpg` | 2033×1146 | 108 KB | **Current hero.** Under 2400px floor — see above. |
| `kid-chocolate-face-coral.jpg` | 2200×1240 | 321 KB | ≥2000px wide. Candid, chocolate-smeared kid on coral bg — playful, on-voice, but a child model may not fit a *corporate* gifting page's tone as well as it did `/story`'s closing grid. |
| `raspberry-stacked-bars.jpg` | 2200×1235 | 216 KB | ≥2000px wide. Macro product shot (broken bar, raspberry filling dripping) on pink bg — matches the brand guide's inferred "macro/close-up, texture" photography style, no human element. |
| `heritage-friends-sharing-chocolate.jpg` | 1956×2200 | 611 KB | **Under 2000px wide** (1956). Portrait orientation — wrong shape for a landscape desktop hero regardless, but genuinely worth a look as a **mobile-only** source if the width floor is relaxed slightly for that use (portrait crops flatter naturally on a tall mobile viewport). Two friends laughing over chocolate — good "Live a Little" energy, human element like the current hero. |
| `craft-hazelnut-bar-flatlay.jpg` | 1241×2200 | 369 KB | **Under 2000px wide** (1241). Portrait, same "maybe mobile-only" caveat as above — overhead flat-lay, less emotionally warm than the friends/kid photos. |
| `heritage-founding-family.jpg` | 847×703 | 104 KB | **Under 2000px wide.** Too small for hero use at any breakpoint. |
| `girl-sunglasses-chocolate-face.jpg` | 546×727 | 88 KB | **Under 2000px wide.** PHOTO_INVENTORY.md already flags this one as card/thumbnail-only, softens past ~700–800px rendered width. |
| `citrus-filled-bar-green.jpg` | 546×727 | 79 KB | **Under 2000px wide.** Same ceiling as above. |
| `woman-eating-chocolate-pink.jpg` | 546×727 | 50 KB | **Under 2000px wide.** Same ceiling as above. |
| `truffles-turmeric-background.jpg` | 545×727 | 53 KB | **Under 2000px wide.** Same ceiling as above. |
| `malort-caramels-product.jpg` | 267×250 | 11 KB | **Under 2000px wide.** A UI/icon-scale asset, not hero material at all. |

(`public/logos/*` and `public/video/*-poster.jpg` excluded — icons and
video posters, not hero-photo candidates.)

## Shopify product images already on the site (≥2000px wide)

Pulled live from the Storefront API (`products(first: 20) { images(first:
5) { url width height } }`) — every product currently has 2–3 images at
or above the 2000px floor, several well beyond it:

| Product | Dimensions | File size (raw, as hosted) |
|---|---|---|
| Coffee & Cookies Bar | 2928×1953 | 6.4 MB |
| Coffee & Cookies Bar | 4000×2668 | 9.3 MB |
| Coffee & Cookies Bar | 4000×2668 | 8.6 MB |
| Cornflake Crunch Bar | 2966×1978 | 6.8 MB |
| Cornflake Crunch Bar | 4000×2668 | 9.2 MB |
| Cornflake Crunch Bar | 4000×2668 | 8.4 MB |
| Waffle Cone Crunch Bar | 2982×1989 | 5.9 MB |
| Waffle Cone Crunch Bar | 2668×2668 | 742 KB |
| Waffle Cone Crunch Bar | 4000×2668 | 558 KB |
| Malort Caramels | 2103×2103 | 1.9 MB |

Resolution is a non-issue here — these are professional product shots
(filename prefix `RCS_TomFoolery_26Sep2026_...`, a very recent shoot),
several at 4000px wide. Two things worth knowing before picking one:

- **These are product close-ups**, not lifestyle/human shots — a
  different mood than the current hero's laughing-woman "Live a Little"
  energy, closer to `raspberry-stacked-bars.jpg`'s macro style above.
  Whether that's the right tone for the Gifting hero specifically is a
  brand-voice call, not a technical one.
- **Raw file sizes are large** (multiple 6–9 MB originals) — a non-issue
  for actual delivery, since `next/image` re-encodes/re-sizes everything
  through its own optimizer regardless of source size (same pipeline
  already handling these exact files on the shop grid/PDP today), but
  worth knowing these aren't pre-optimized the way the `/public/photos`
  set already is.

## Bottom line

Two real desktop-hero-ready candidates already in the repo with headroom
for full-bleed use and a human/lifestyle mood closer to the current
hero's: **`kid-chocolate-face-coral.jpg`** and, in a more product-forward
macro style, **`raspberry-stacked-bars.jpg`** — both already flagged in
`brand/PHOTO_INVENTORY.md` as having "headroom for full-bleed or large
hero use." The Shopify product shots are resolution-wise the strongest
option by far (up to 4000px) if a product-forward (not lifestyle) mood is
acceptable for this page. Nothing here is swapped in — this is reference
only, for whoever makes that call.
