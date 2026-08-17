# Tom Foolery Chocolate

Premium chocolate that doesn't take itself too seriously. This is the
marketing site + headless storefront: a scroll-driven brand story built on
GSAP/Lenis, backed by a Shopify Storefront API commerce layer (catalog, PDP,
cart) with no SDK dependency.

**Live a Little.**

## Stack

- **Next.js 16** (App Router, Turbopack, TypeScript)
- **Tailwind CSS v4** — CSS-first design tokens (`src/app/globals.css`) mapped
  onto utilities via `tailwind.config.ts`
- **GSAP + `@gsap/react` + Lenis** — pinned/scrubbed scroll sections, all with
  a `prefers-reduced-motion` fallback baked in
- **Shopify Storefront API** — plain `fetch`, typed, no SDK
  (`src/lib/shopify/`)
- **React 19** — `useOptimistic` drives the cart drawer's instant
  add/update/remove feedback

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts: `npm run build` (production build), `npm run start` (serve
the build), `npm run lint`.

## Environment variables

Copy `.env.example` to `.env.local` and fill in real values to talk to a
live Shopify store:

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `SHOPIFY_STORE_DOMAIN` | Your store's `*.myshopify.com` domain |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | A Storefront API access token (Settings → Apps → Develop apps) |

**Neither is required.** If either is unset, `src/lib/shopify/queries.ts`
transparently falls back to `src/lib/shopify/mock-data.ts` — six in-universe
placeholder products with brand-colored imagery and a full in-memory mock
cart, so the entire site (browsing, PDP, cart, checkout link) works out of
the box with zero configuration. This is also exactly what a first Vercel
deploy runs on until you add the two env vars.

## Deploying on Vercel

This app needs a server runtime — React Server Components, on-demand
revalidation, and cart cookies all require it, so static hosts like GitHub
Pages can't run it. Vercel is the natural fit for a Next.js app.

1. Push this repo to GitHub (already done if you're reading this from there).
2. On [vercel.com](https://vercel.com), import the repo — no config needed,
   Vercel auto-detects Next.js.
3. Optionally add `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
   as Environment Variables to go live with real product data. Skip this to
   ship with mock data first.
4. Deploy. Every push to `main` redeploys automatically.

## Video assets

`BrandVideo` (`src/components/media/BrandVideo.tsx`) is the performance-safe
wrapper for brand clips (Higgsfield-generated or otherwise) — lazy-loads
only once scrolled near viewport, pauses when scrolled away, and falls back
to a plain poster image (no `<video>` element at all) under
`prefers-reduced-motion` or a data-saver connection. It's wired into:

- `Hero`'s optional `backgroundVideo` prop (see it live on `/` — the
  current clip is a Higgsfield orbit render of the raspberry-filled bar
  photo, `public/video/hero-orbit.*`)
- `StorySection`'s `media` slot (accepts `BrandVideo` anywhere it accepts
  `next/image`)
- `ProductCard`'s optional `hoverVideo` prop (crossfades in on hover, pointer
  devices only — touch always just sees the static photo)

To add a new clip: drop the raw export at the repo root as
`<name>-source.mp4` (gitignored) and run `scripts/encode-video.sh
<name>-source.mp4 <name>` — see `public/video/README.md` for the full
naming convention and wiring examples.

## Project structure

```
src/
├── app/                    — routes (/, /shop, /shop/[handle])
├── components/
│   ├── commerce/           — cart, product grid/card/detail, add-to-cart
│   ├── layout/              — Nav, Footer
│   ├── media/                — BrandVideo (lazy, reduced-motion-aware clips)
│   ├── motion/                 — PinnedSection, shared gsap setup
│   ├── providers/                — Lenis smooth-scroll wiring
│   ├── sections/                   — Hero, StorySection
│   └── ui/                           — typography, Button, Marquee, StripeDivider
└── lib/
    ├── shopify/                        — client, queries, mock-data, types, actions
    ├── hooks/                            — useMediaPreferences, useHoverCapableDevice
    ├── fonts.ts                           — next/font/google setup (Fraunces/Figtree)
    └── theme.ts                            — brand color token helpers

scripts/
└── encode-video.sh          — raw clip → public/video/ webm+mp4+poster trio
```
