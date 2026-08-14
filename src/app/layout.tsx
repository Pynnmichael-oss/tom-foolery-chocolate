import type { Metadata } from "next";
import "./globals.css";
import { featureDeck, sofia } from "@/lib/fonts";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Nav } from "@/components/layout/Nav";
import { CartProvider } from "@/components/commerce/CartProvider";
import { CartDrawer } from "@/components/commerce/CartDrawer";

export const metadata: Metadata = {
  title: "Tom Foolery Chocolate — Live a Little",
  description: "Chocolate as interesting as it is irresistible.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${featureDeck.variable} ${sofia.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg font-sofia text-fg">
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
