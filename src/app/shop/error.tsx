"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { EyesHatIcon } from "@/components/ui/logos";

/**
 * Error boundary for the whole /shop subtree — covers both the grid
 * (/shop) and every product page (/shop/[handle]), since a Next.js
 * error.tsx boundary applies to its own segment and everything nested
 * under it, not just the exact file it sits next to.
 *
 * Only reachable via a genuinely thrown error. A product that legitimately
 * doesn't exist already goes through notFound() → the global
 * not-found.tsx (see that file) — this never handles that case.
 *
 * The scenario this exists for: queries.ts's getProducts/getProduct now
 * rethrow in production instead of quietly falling back to mock data
 * (see mock-data.ts's own top comment). ISR means a *revalidation*
 * failure on an already-built page keeps serving the last good static
 * output automatically — Next's own behavior, this component does
 * nothing for that case — so this only actually renders for a genuine
 * first-ever render failure: a brand-new product page, or /shop itself
 * before it's ever built successfully, hitting a real Shopify outage,
 * expired token, etc. with no prior success to fall back to.
 */
export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[shop] render error:", error);
  }, [error]);

  return (
    <main
      id="main-content"
      // text-tf-white here, not on the "Back to Home" link itself: the
      // secondary button variant deliberately uses text-current (see
      // buttonClasses.ts) so it inherits whatever color the surrounding
      // section set, and Tailwind utility classes have equal specificity
      // — appending a conflicting text-* class straight onto the link
      // wouldn't reliably win over text-current depending on generated
      // rule order. Setting it up here, once, is the pattern every other
      // buttonClasses("secondary") caller in this codebase already
      // relies on.
      className="flex min-h-dvh w-full flex-col items-center justify-center gap-fluid-md bg-tf-black px-fluid-md py-fluid-2xl text-center text-tf-white"
    >
      <EyesHatIcon tone="negative" width={72} />

      <Preheader className="text-tf-white/90">A Little Stuck</Preheader>

      <Headline as="h1" size="md" className="max-w-2xl text-tf-white">
        Our Chocolate Got Stuck In The Works
      </Headline>

      <BodyText className="max-w-md text-tf-white/80">
        Something went sideways loading the shop. Give it another go, or
        head back to home while we sort it out.
      </BodyText>

      <div className="mt-fluid-sm flex flex-wrap items-center justify-center gap-fluid-sm">
        <button type="button" onClick={reset} className={buttonClasses("primary")}>
          Try Again
        </button>
        <Link href="/" className={buttonClasses("secondary")}>
          Back to Home
        </Link>
      </div>
    </main>
  );
}
