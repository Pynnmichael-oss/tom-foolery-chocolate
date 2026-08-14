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
  },
};

export default nextConfig;
