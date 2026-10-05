import type { NextConfig } from "next";

// Fail the build rather than ship canonical URLs, OG/Twitter images, the
// sitemap, and robots.txt pointed at a placeholder host — a launch
// blocker that's easy to miss otherwise (see src/lib/site.ts's SITE_URL,
// which every one of those reads). Scoped to `VERCEL_ENV === "production"`
// specifically (not the broader isProductionRuntime helper elsewhere in
// this repo) — a plain local `next build` and Vercel Preview deploys both
// legitimately have no real domain yet, and shouldn't fail over it.
if (process.env.VERCEL_ENV === "production") {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl || /localhost|\.vercel\.app/i.test(siteUrl)) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL is unset or points at a placeholder host (got: ${JSON.stringify(siteUrl ?? null)}). ` +
        "Set it to the real production domain in Vercel → Project Settings → Environment Variables (Production) before deploying."
    );
  }
}

const nextConfig: NextConfig = {
  // Old-theme URL migration (2026-10-04 domain cutover from Shopify's
  // theme to this app — see docs/INTEGRATIONS.md). Source paths pulled
  // from the old theme's own sitemap (still reachable at
  // checkout.tomfoolerychocolate.com/sitemap*.xml post-cutover, since
  // that subdomain stays pointed at Shopify for checkout). `/collections/*`
  // isn't listed here because this app already serves that same path
  // structure (`/collections/[handle]`) — nothing to redirect. Three old
  // URLs had no equivalent page on this site and are NOT redirected here
  // pending a content decision: `/pages/data-sharing-opt-out` (CCPA
  // opt-out — no privacy-choices mechanism exists on this app yet),
  // `/pages/free-chocolate-for-a-year-terms-conditions` (expired promo's
  // specific terms, not the same as this app's general `/terms`), and
  // `/blogs/news` (this app has no blog section).
  async redirects() {
    return [
      {
        source: "/products/:handle*",
        destination: "/shop/:handle*",
        permanent: true,
      },
      {
        source: "/pages/contact",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/pages/frequently-asked-questions",
        destination: "/faq",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      // Real Shopify product imagery.
      { protocol: "https", hostname: "cdn.shopify.com" },
      // Placeholder imagery used by lib/shopify/mock-data.ts when no
      // Shopify credentials are configured.
      { protocol: "https", hostname: "placehold.co" },
    ],
    // Next 16 breaking change: `images.qualities` now defaults to [75]
    // only, and any `quality` prop outside the allow-list gets rejected
    // by the /_next/image route (a hard 400 on that request, not a
    // silent coercion — confirmed by hand: GiftingHero's `quality={85}`
    // took its full hero photo down site-wide until this was added).
    // Keeping 75 alongside 85 since it's next/image's own default and
    // every other `<Image>` on the site that doesn't set `quality`
    // explicitly still requests it.
    qualities: [75, 85],
  },
};

export default nextConfig;
