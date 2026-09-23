import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
