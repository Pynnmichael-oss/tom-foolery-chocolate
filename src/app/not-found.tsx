import type { Metadata } from "next";
import Link from "next/link";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Logo } from "@/components/ui/logos";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

/** No GSAP, no scroll-scrub — static and light, on purpose. */
export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-dvh w-full flex-col items-center justify-center gap-fluid-md bg-tf-black px-fluid-md py-fluid-2xl text-center"
    >
      <Logo variant="icon" tone="negative" width={72} height={86} alt="" priority />

      <Preheader className="text-tf-white/90">A Little Lost</Preheader>

      <Headline as="h1" size="md" className="max-w-2xl text-tf-white">
        This Page Pulled a Vanishing Act
      </Headline>

      <BodyText className="max-w-md text-tf-white/80">
        Even our cleverest chocolatiers couldn&rsquo;t track it down. Let&rsquo;s
        get you back to the good stuff.
      </BodyText>

      <Link href="/" className={buttonClasses("primary", "mt-fluid-sm")}>
        Back to Home
      </Link>
    </main>
  );
}
