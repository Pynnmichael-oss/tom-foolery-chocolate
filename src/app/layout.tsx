import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { newsreader, poppins } from "@/lib/fonts";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/commerce/CartProvider";
import { CartDrawer } from "@/components/commerce/CartDrawer";
import { OmnisendSnippet } from "@/components/analytics/OmnisendSnippet";
import { OmnisendPageView } from "@/components/analytics/OmnisendPageView";
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

/**
 * Runs synchronously while the HTML is parsed, before first paint. Marks the
 * document as JS-enabled so hero entrance styles in globals.css (gated on
 * `html.js`) can set the hidden starting state without hiding anything from
 * no-JS visitors. The timeout is a failsafe: if the JS bundle never takes
 * over (script error, blocked chunk), drop the class so nothing stays
 * hidden — elements GSAP already owns carry inline styles, which the class
 * removal doesn't affect.
 */
const JS_CLASS_SCRIPT = `(function(){var e=document.documentElement;e.classList.add("js");setTimeout(function(){e.classList.remove("js")},10000)})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${poppins.variable} h-full antialiased`}
      // The inline script below adds `js` to this element before hydration.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_CLASS_SCRIPT }} />
      </head>
      <body className="min-h-full bg-bg font-sans text-fg">
        <OrganizationJsonLd />
        <OmnisendSnippet />
        {/* useSearchParams (inside OmnisendPageView) opts its subtree out
         * of static rendering unless wrapped in Suspense — see that
         * component's own comment. */}
        <Suspense fallback={null}>
          <OmnisendPageView />
        </Suspense>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-tf-cinnamon-strong focus:px-fluid-md focus:py-fluid-sm focus:font-sans focus:font-black focus:uppercase focus:tracking-[0.075em] focus:text-tf-white focus:outline-none focus:ring-2 focus:ring-tf-white"
        >
          Skip to content
        </a>
        <SmoothScroll>
          <CartProvider>
            <Nav />
            {children}
            {/* Root-layout mount (moved out of the homepage, 2026-09-28)
             * so it renders on every route, not just `/` — a launch
             * blocker: FAQ/Wholesale/Where to Find Us/policy links were
             * otherwise unreachable from every other page. */}
            <Footer />
            <CartDrawer />
          </CartProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
