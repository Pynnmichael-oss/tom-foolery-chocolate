import type { Metadata } from "next";
import "./globals.css";
import { featureDeck, sofia } from "@/lib/fonts";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Nav } from "@/components/layout/Nav";
import { CartProvider } from "@/components/commerce/CartProvider";
import { CartDrawer } from "@/components/commerce/CartDrawer";
import { OrganizationJsonLd } from "@/components/seo/OrganizationJsonLd";
import { POWER_STATEMENTS, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${POWER_STATEMENTS.liveALittle}`,
    template: `%s — ${SITE_NAME}`,
  },
  description: POWER_STATEMENTS.chocolateInteresting,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${POWER_STATEMENTS.liveALittle}`,
    description: POWER_STATEMENTS.chocolateInteresting,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${POWER_STATEMENTS.liveALittle}`,
    description: POWER_STATEMENTS.chocolateInteresting,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${featureDeck.variable} ${sofia.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg font-sofia text-fg">
        <OrganizationJsonLd />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-tf-cinnamon-strong focus:px-fluid-md focus:py-fluid-sm focus:font-sofia focus:font-black focus:uppercase focus:tracking-[0.075em] focus:text-tf-white focus:outline-none focus:ring-2 focus:ring-tf-white"
        >
          Skip to content
        </a>
        <SmoothScroll>
          <CartProvider>
            <Nav />
            {children}
            <CartDrawer />
          </CartProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
