import Link from "next/link";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { buttonClasses } from "@/components/ui/buttonClasses";

export interface ComingSoonPageProps {
  preheader: string;
  headline: string;
  body: string;
}

/**
 * Shared shell for the four footer nav placeholder routes (FAQ,
 * Wholesale, Where to Find Us, Corporate Gifting) — real content lands
 * page-by-page later without touching this shell. No GSAP: these are
 * low-traffic placeholder pages, same "static and light, on purpose"
 * call as `not-found.tsx`. Unlike `not-found.tsx` this isn't an error
 * state, so it stays on the plain white/black MAIN treatment (inherited
 * `bg-bg`/`text-fg` from `body`) rather than the dramatic full-bleed
 * black used for 404.
 */
export function ComingSoonPage({ preheader, headline, body }: ComingSoonPageProps) {
  return (
    <main
      id="main-content"
      className="flex min-h-dvh w-full flex-col items-center justify-center gap-fluid-md px-fluid-md py-fluid-2xl text-center"
    >
      <Preheader>{preheader}</Preheader>

      <Headline as="h1" size="md" className="max-w-2xl">
        {headline}
      </Headline>

      <BodyText className="max-w-md text-fg/80">{body}</BodyText>

      <Link href="/" className={buttonClasses("primary", "mt-fluid-sm")}>
        Back to Home
      </Link>
    </main>
  );
}
