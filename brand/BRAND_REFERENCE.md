# Tom Foolery — Brand Reference (Developer Distillation)

Derived from `TomFoolery_Brand_Standards_August2026.pdf` (Version 1.0,
created August 2026) — that PDF is a licensed internal document, kept local
only (see `.gitignore`), so **this file is the durable, versioned source of
truth for this codebase**. When code and this file disagree, this file
wins (unless a GAP below says otherwise). If a future guide revision
changes something, update this file first, then the code.

---

## 1. Voice & Messaging

### Brand idea

> **Live a Little**

The brand story, told through the lens of giving people permission to
enjoy — letting loose, letting go of everyday worries, a little moment of
sweet rebellion. "What's the harm!? It's just a little chocolate, after all."

**North Star** (the one emotion the brand should leave people with):
**Gratification.**

**The four tenets** (brand compass):

| Tenet | What it means |
| --- | --- |
| Originality is Our Favorite Flavor | We're **Clever & Curious Chocolatiers** — known for original flavor combinations |
| A Total Wow | We're **Larger than Life** — designed to surprise and delight with color, flavor, flash |
| Chocolate is Never Sad | We're **Simply Joyful** — a beacon of joy, a place to forget your problems |
| Throw Caution to the Wind | Customers feel **a Touch of Rebellion** — indulging without concern for norms/rules |

### Personality traits

**Tom Foolery is:** Playful, Experimental, Exuberant, Fun-loving, An escape
from reality, Irreverent, Playful absurdity, A little left of center,
Whimsical, Unconventional, Imaginative, A twinkle in the eye, A touch of the
surreal, Theatrical, Visual abundance, Charismatic, Magnetic, Sweet (not
soft), A little push/pull, Tension between good and bad, Exciting.

**...but is never:** Childish, Too sweet, Candyland, Revered, Precious,
Fancy, Bougie, Mercurial, Untrustworthy, Temperamental, Trickster (the
capital-T Roald Dahl kind), Willy Wonka, Fashionista, Frivolous, Trendy,
Performative pretension.

### Power Statements (verbatim — use these exactly)

Use **only one Power Statement per application** (headlines, flyers, pitch
deck breakers, website pages).

1. **Live a Little**
2. **Chocolate as Interesting as it is Irresistible**
3. **A Little Fun Always Tastes Better**
4. **Treat Yourself to Some Tom Foolery**
5. **You're in for a Real Treat. 100% Real.**

Additional power statements (same one-per-application rule applies):
"Get in on the Good Stuff" · "Anything but Boring" · "That's the Ticket" ·
"Real Life can Wait" · "Just the Thing" · "All in Good Fun" · "Sweet on
Life" · "The Best Flavor is Fun" · "This Chocolate is Tip Top. 100% Real."

### Voice rules for copywriting

- Tom is a bit of a trickster with a mischievous heart — a good-natured
  prank, "wears a fake mustache from time to time."
- Puns are allowed. *"Please pun responsibly!"*
- Clever, not lazy — the guide explicitly calls for continued investment in
  quality copywriting.
- Mid-century moxie as "seasoning" — used sparingly, evocative of a
  simpler, more joyful time. Less is more.
- The guide doesn't yet know where every piece of copy will land — voice
  over placement.

**"Fun About" statement template** (for bios/about blurbs):
"Tom Foolery. Curious chocolates made for mischief and merriment." — also
seen with: good times and giggles / hoots and hollers / sweet moments and
silliness / carefree romps and ruckus / high spirits and hijinks.

**Sample blurb** (tone reference): *"My advice? Life is too short not to be
sweet. A good giggle, a clever quip, an unexpected delight. Real life can
wait. Have some chocolate."*

---

## 2. Colors

| Name | Role | HEX | Pantone | CMYK |
| --- | --- | --- | --- | --- |
| Black | MAIN | `#25382A` | — | C0 M0 Y0 K100 — see [Gap 1](#gaps--conflicts) (resolved: hex is authoritative) |
| White | MAIN | `#FFFFFF` | — | C0 M0 Y0 K0 |
| Turmeric | ACCENT | `#E8BC5C` | 2006 C | C09 M25 Y75 K0 |
| Cinnamon | ACCENT | `#DE5C42` | 7625 C | C07 M78 Y79 K1 |
| Juniper | ACCENT | `#9DD4CB` | 565 C | C38 M01 Y23 K0 |
| Rose | ACCENT | `#EFADB2` | 700 C | C03 M38 Y18 K0 |

**Usage rules (stated explicitly in the guide):**

- **MAIN** (Black, White): *"Use for headlines, text, main color blocks, and
  primary elements."*
- **ACCENTS** (Turmeric, Cinnamon, Juniper, Rose): *"Use for extra emphasis
  throughout the brand."*
- Note to designers: *"CMYK and HEX values may differ from PANTONE® Color
  Bridge specifications. Always use the values specified in this
  document."* — i.e. the hex/CMYK here win over eyeballing the Pantone chip.
- More accent colors are coming later, one per specific flavor cue — not
  yet defined.

---

## 3. Typography

| Style | Typeface | Case | Tracking (print) | Line height (print) |
| --- | --- | --- | --- | --- |
| Preheader | Sofia Pro **Black** | ALL CAPS — always. Never Title Case or lowercase. | 75 | type size **+ 3pt** |
| Header | Feature Deck **Regular** | Title Case | 0 | type size **+ 12pt** |
| Body Copy | Sofia Pro **Regular** | Sentence case. All caps must never be used in body paragraphs. | 0 | type size **+ 8pt** |

**Proportionality rule** (stated verbatim): *"Type styles should always be
proportional to each other (i.e., Preheader should never appear larger than
Header, etc.)"*

### CSS translation

InDesign tracking is in thousandths of an em, so `tracking: 75` = `0.075em`
directly — no conversion needed. Line-height is print's *additive* model
(a fixed point amount added to whatever size you're using), which doesn't
translate to a single CSS unitless ratio (that ratio isn't constant — it
gets proportionally tighter as size increases). The precise translation is
`calc(1em + Npx)`, which reproduces the additive rule exactly at *any* font
size — the right fit for our fluid `clamp()` type scale. (1pt = 1.3333px,
the fixed PostScript-point-to-CSS-pixel ratio — this part of the
conversion is just unit math, not a guide interpretation call.)

| Style | Tracking → CSS | Line height (print) → CSS |
| --- | --- | --- |
| Preheader | `letter-spacing: 0.075em` | `+3pt` → `line-height: calc(1em + 4px)` |
| Header | `letter-spacing: normal` (0) | `+12pt` → `line-height: calc(1em + 16px)` |
| Body | `letter-spacing: normal` (0) | `+8pt` → `line-height: calc(1em + 10.67px)` |

*(Reference only, if a project ever needs a plain unitless ratio instead of
`calc()`: at our actual in-app sizes this works out to roughly 1.25–1.33 for
Preheader, 1.14–1.4 for Header depending on tier, and ~1.53–1.67 for Body —
but these ratios shift with size, so `calc(1em + Npx)` is the only exact
translation and should be preferred.)*

### Prohibitions

- All caps must never appear in body-copy paragraphs.
- Preheader must only ever be ALL CAPS — never Title Case, never lowercase.
- Preheader must never render larger than Header (and generally, styles
  must stay proportional to each other).

### Font substitutions (print/email fallback only)

Only for extremely limited cases where brand fonts aren't installed (e.g.
email, form-fillable PDF) — **not** relevant to the web build, which
self-hosts the real files via `next/font/local`, but documented for
completeness:

- Sofia Pro Black → Arial Black
- Feature Deck Regular → Georgia Regular
- Sofia Pro Regular → Arial Regular

---

## 4. Logos

### Variants

| Variant | When to use |
| --- | --- |
| **Primary** | Most instances; a customer's first brand impression; signage, packaging, anything outside the brand environment |
| **Secondary** | Less horizontal space available; tagline needs to stay legible at a smaller size |
| **Horizontal Signature** | In place of Primary when the tagline isn't necessary or is shown elsewhere |
| **Stacked Signature** | Same as Horizontal Signature, for contexts with more vertical than horizontal space |
| **Badge** | Social avatars, merch, marketing accents |
| **Icon** ("OO" eyes+hat) | Social avatars, merch, marketing accents |
| **Hat** | On photos / in-store mirrors, positioned to look "worn" by the subject |
| **Sign Off** ("–Tom") | Bottom of a statement, as if it's a note directly from Tom |
| **Tom Wuz Here** (stacked / horizontal) | Hidden surprise easter egg — inside packaging, site footer, a hidden store corner. Horizontal variant for wide/short spaces. |

Every variant (Primary/Secondary/Horizontal/Stacked) ships in two color
treatments:

- **Positive** — dark logo, for light backgrounds
- **Negative** — light/white logo, for dark backgrounds

Each of the 4 main variants also has a **small-scale** version (bigger
TM, and for Primary/Secondary, a bigger tagline) for use below its normal
minimum size.

### Minimum sizes

Stated directly in the guide as px (their own inch→px conversion uses
**72px/inch**, not the CSS/web-standard 96dpi — see
[Gap 2](#gaps--conflicts)). Treat the stated px values below as the literal
CSS px minimums:

| Asset | Minimum | Small-scale minimum |
| --- | --- | --- |
| Primary | 144px wide | 90px wide |
| Secondary | 117px wide | 63px wide |
| Horizontal Signature | 144px wide | 90px wide |
| Stacked Signature | **108px tall** (not wide) | 63px wide |
| Badge | 54px wide | — |
| Icon | 27px wide | — |
| Hat | 18px wide | — |
| Sign Off | 45px wide | — |
| Tom Wuz Here (Stacked) | 72px wide | — |
| Tom Wuz Here (Horizontal) | 54px wide ⚠ see [Gap 2](#gaps--conflicts) | — |

### Clear space

*"A minimum amount of clear space must always surround the Tom Foolery
Logo, relative to the size of the Logo itself. Use the hat icon in Tom
Foolery to determine the minimum amount of clear space needed around the
Logo."* No numeric multiplier is printed anywhere in the document — only a
diagram showing the hat icon repeated around the logo's bounding box. See
[Gap 3](#gaps--conflicts).

### Don'ts

1. Do not use unapproved colors for the Logo.
2. Do not use background colors or patterns that make the Logo difficult
   to read.
3. Do not alter the Logo — no stretching, drop shadows, strokes, or other
   visual effects.

---

## 5. Graphic Elements & Textures

- **Textures**: brand-colored swaths with a vintage-print/fabric-weave
  texture. Used as a backdrop (packaging → social posts) or applied to
  packaging files/illustrations for a retro effect. Shown in five color
  swatches: a near-black charcoal, Juniper, Rose, Cinnamon, and White.
- **Stripes**: the signature pattern. Borders/frames for packaging, social
  posts, and interior-decor accents. Can run horizontal or vertical.
  **Rule: stripes must only ever be black and white** — never rendered in
  any brand accent color.
- **Characters / Illustrations**: "the many secret and sneaky identities of
  Tom" — a growing suite of disguise illustrations (examples shown: a bald
  man, a curly-haired woman, a fox, a dog). Every character shares the same
  two elements: **Tom's eyes** (cartoon "OO" eyes) and **Tom's hat**
  (the same triangular/crown-shaped hat used in the Icon/Hat logo lockups).
  More characters will be added to the standards as they're developed.
- **Character in Stripes**: a version of the stripe pattern with Tom's
  eyes peeking out from between the stripes — used for "fun reveals" and
  surprise details.
- The **hat** shape does double duty: it's also the unit used to measure
  logo clear space (§4).

---

## 6. Photography / Imagery

**No dedicated photography guidelines section exists in this version of
the guide** (confirmed absent from the table of contents and full text —
see [Gap 4](#gaps--conflicts)). The "Putting It All Together" example
applications (chocolate bar packaging, bonbon box, sample social posts) do
show a consistent style, but it's **inferred from examples, not a written
rule** — treat as directional inspiration, not a spec to enforce:

- Bright, saturated solid-color backdrops pulled from the accent palette
- Candid, genuinely joyful human portraits (real laughter, mid-bite
  moments) — both adult and child subjects
- Macro/close-up product shots showing chocolate texture — broken bars,
  melted drips, cross-sections
- Occasional use of the black/white stripe pattern as a photo frame/border
- Layered typography over photography (Feature Deck headlines, handwritten
  "–Tom" sign-offs, Sofia Pro labels)

**Site photography, in use as of August 2026:** the three homepage
`StorySection`s now run real photography extracted from this guide's own
example-application pages (candid lifestyle shots, a macro product
flat-lay) rather than placeholder color blocks — see
[`PHOTO_INVENTORY.md`](./PHOTO_INVENTORY.md) for the full extraction
inventory, source pages, and six additional backup photos not yet placed.
These are the guide's own photography, not commissioned assets — swap in
final photography under the same filenames in `public/photos/` whenever it
arrives, no code changes needed.

---

## 7. Gaps & Conflicts

Flagged rather than guessed — these need a human decision, not a silent
code fix.

1. **RESOLVED — Black: swatch fill vs. printed hex.** The Color page's
   "Black" swatch is filled with literal `#000000` (confirmed by sampling
   the rendered PDF page — RGB 0,0,0), and its own CMYK value
   (`C0 M0 Y0 K100`) is also pure black. But the *printed hex text* on the
   same page says `#25382A` (a dark blackened-green) — the swatch render
   and the hex label contradict each other within the guide itself.
   **Resolution: `#25382A` is authoritative for all web/screen use.** The
   guide states its own tie-breaker rule directly above this color block —
   *"CMYK and HEX values may differ from PANTONE® Color Bridge
   specifications. Always use the values specified in this document"* — and
   the value specified *in text*, not a possibly-mis-rendered swatch fill,
   is `#25382A`. A rendered swatch is exactly the kind of output the
   warning is guarding against. Our codebase already uses `#25382A`
   everywhere; no code change needed. Closed — not an open question.

2. **Logo minimum sizes: inch→px math is inconsistent for one entry.**
   Every stated minimum checks out under "1 inch = 72px" (2" → 144px,
   1.25" → 90px, 1.625" → 117px, etc.) **except** Tom Wuz Here
   (Horizontal), which states **.5" / 54px** — 72dpi math gives 36px, not
   54px. Likely a typo in the guide. We've treated the literal 54px as
   authoritative in §4 (that's clearly the intended number), but flagging
   for the brand team to confirm.

3. **Logo clear space has no numeric value.** The guide says to use the
   hat icon to measure clear space but prints no ratio (e.g. "1× hat
   height on all sides") — only an un-labeled diagram. We don't have the
   hat icon's real vector proportions to derive an exact number. Needs
   either the actual asset file (see item 6 below) or a direct answer from
   the brand team.

4. **No photography section exists yet.** §6 above is inferred from
   example applications, not a stated rule. Fine to use as inspiration; not
   something to enforce as a hard requirement until the guide adds one.
   **Update:** the site now uses real photos pulled from those same example
   pages (see §6 and `PHOTO_INVENTORY.md`) — this doesn't resolve the gap
   (still no *written* photography rule), it just means the current site
   imagery happens to already match the inferred style by construction.

5. **Print leading doesn't map 1:1 onto fluid/responsive type.** The
   `calc(1em + Npx)` translation in §3 is exact at any single font size,
   which is what makes it work with our `clamp()`-based fluid scale — but
   it's a deliberate translation choice the guide (print-first throughout)
   never had to consider. Documented here so it doesn't look like an
   arbitrary invention later.

6. **PARTIALLY RESOLVED — logo assets are real vectors now; fonts still
   pending.** `src/components/ui/logos.tsx` renders five real marks —
   PrimaryLogo, SecondaryLogo, HorizontalSignature, StackedSignature,
   EyesHatIcon — as inline SVG (`fill="currentColor"`, themed via
   `tone="positive"|"negative"` + Tailwind's `text-tf-black`/`text-tf-white`,
   one shape per mark, no separate pos/neg files). Wired into Nav, Hero,
   Footer, and CartDrawer, replacing the earlier raster PNGs (which
   themselves replaced the original generic circle-and-drip placeholder).
   Cleaned source SVGs live in `public/brand/`. The component enforces the
   guide's stated minimum size per mark with a dev-mode console warning.

   **Provenance, honestly**: `pdftocairo -svg` doesn't honor pixel crop
   options (`-x/-y/-W/-H` are raster-only in this poppler build), so
   isolating a specific logo's path group straight from the page wasn't
   available. The practical path was: crop + alpha-mask the same clean
   600dpi rasters from the earlier pass, normalize to solid black-on-white,
   then trace with `vtracer` (spline mode) and clean with `svgo`. These are
   **not** the actual licensed vector source files — the guide references
   a linked "Tom Foolery Brand Assets" folder (📂 click-through in the PDF,
   likely Drive/Dropbox) that should have the real SVG/AI/EPS. Swap those
   in when available; `logos.tsx`'s component API doesn't need to change.
   `public/logos/icon-{positive,negative}.png` still exist deliberately
   (not leftovers) — see `public/logos/README.md` — for the OG image and
   Organization JSON-LD, where a raster is more reliable than satori
   nesting an SVG or a structured-data consumer parsing one.

   Still not extracted at all: Badge, Hat-alone, Sign Off, "Tom Wuz Here"
   (not used anywhere in the current app) — see the audit below for
   exactly what was pulled and from where.

7. **Feature Deck is a serif display face**, per the guide's own type
   specimen and the "Live a Little" example — not a script/cursive face.
   Our current placeholder webfont (a borrowed OFL "Geist" file, sans-serif
   — see `public/fonts/README.md`) doesn't visually match it, though our
   CSS fallback stack (`Georgia, serif`) does. No action needed beyond
   swapping in the real licensed font eventually; noting it's now
   confirmed correct-in-spirit.

8. **More accent colors are coming** ("Additional colors will be used for
   specific flavor cues... added to these standards as selected") — not
   yet defined, nothing to implement yet.

---

## Appendix: Codebase Audit (against this reference, August 2026)

Ranked by severity. Objective errors were fixed directly; judgment calls
were flagged and resolved with the project owner before touching code.

### High

- **RESOLVED (for now) — no real logo assets, no `logos.tsx`.** Every
  "logo" was a generic placeholder circle-and-drip icon —
  `src/components/sections/Hero.tsx:70-86`,
  `src/components/layout/Nav.tsx:25-40`,
  `src/components/layout/Footer.tsx:19-34`,
  `src/components/commerce/CartDrawer.tsx:89-104`. **Fixed in two passes**:
  first with raster PNGs pulled from the PDF, then upgraded to real inline
  SVG vectors (`src/components/ui/logos.tsx`, sources in `public/brand/`)
  — five marks (Primary, Secondary, Horizontal Signature, Stacked
  Signature, Icon), per-mark minimum-size enforcement, wired into all four
  locations. `Nav.tsx`'s logo wrapper minimum was updated from
  `min-w-[90px]` (the small-scale variant's minimum — we aren't using that
  asset) to `min-w-[144px]`, correctly matching the regular Horizontal
  Signature minimum for the asset actually in use. Still not the actual
  licensed vector files — see [Gap 6](#gaps--conflicts) for provenance and
  what should replace them.
- **`Headline` line-height was tighter than 1:1** (`leading-[0.95]`),
  contradicting the guide's Header rule (always looser than 1:1) —
  `src/components/ui/typography.tsx:85` and the duplicate hand-rolled
  headline in `src/components/sections/Hero.tsx:97`. **Fixed** — both now
  use `lineHeight: "calc(1em + 16px)"`.

### Medium

- `Hero.tsx:90`'s preheader paragraph used `tracking-[0.2em]` instead of
  the guide's 0.075em — it bypasses the shared `Preheader` component
  (which already had the correct value) with hand-rolled styling that had
  drifted. **Fixed.**
- `Preheader` and `BodyText` (`src/components/ui/typography.tsx`) had no
  explicit line-height at all, silently inheriting the global
  `body { line-height: 1.5 }` instead of the guide's +3pt / +8pt rules.
  **Fixed** — added `calc(1em + 4px)` and `calc(1em + 10.67px)`
  respectively.
- `StorySection` used ACCENT colors (juniper/rose/turmeric) as full-bleed
  section backgrounds, where the guide reserves "main color blocks" for
  MAIN (Black/White). **Resolved (hybrid, by request)**: the middle
  section's background changed from `rose` to `white` in
  `src/app/page.tsx:23` — two of three sections stay colorful, one is now
  MAIN, per the owner's call.
- Guide-side issue, resolved, not a code fix: the "Black" swatch's
  rendered fill is literal `#000000`, contradicting its own printed hex
  label `#25382A` — see [Gap 1](#gaps--conflicts) (hex ruled authoritative
  per the guide's own tie-breaker rule). Code already matches it.

### Low

- `Button.tsx:13` used `tracking-[0.05em]`, inconsistent with 0.075em used
  everywhere else for this exact treatment. **Fixed (by request)** — now
  0.075em.
- `Hero.tsx:112` (scroll-cue label) used `tracking-[0.3em]` with no
  Black weight; `Footer.tsx:61` (social links) used 0.075em but no Black
  weight. Neither is literally tagged as Preheader content, but both
  echo its visual style. **Fixed (by request)** — both now
  `font-black tracking-[0.075em]`.
- Power statements and phrase-level copy (Hero, Marquee, layout metadata)
  were checked word-for-word against §1 — all verbatim, no misquotes
  found. No fix needed.
- All six color values in `src/app/globals.css:6-11` match the guide's
  hex values exactly. No fix needed.
- `Preheader`'s enforced ALL CAPS, `Headline`'s un-forced Title Case, and
  `Preheader`/`Headline` size-scale separation (guaranteeing Preheader can
  never render larger than Header) all already matched the guide. No
  fix needed.
