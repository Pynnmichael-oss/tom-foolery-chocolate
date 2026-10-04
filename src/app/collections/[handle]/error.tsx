"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { EyesHatIcon } from "@/components/ui/logos";

/**
 * Error boundary for /collections/[handle] — mirrors /shop/error.tsx (see
 * that file's own comment for the full rationale: this only renders for a
 * genuine first-ever render failure, since ISR already keeps serving the
 * last good static output on a revalidation failure).
 */
export default function CollectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[collections] render error:", error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="flex min-h-dvh w-full flex-col items-center justify-center gap-fluid-md bg-tf-black px-fluid-md py-fluid-2xl text-center text-tf-white"
    >
      <EyesHatIcon tone="negative" width={72} />

      <Preheader className="text-tf-white/90">A Little Stuck</Preheader>

      <Headline as="h1" size="md" className="max-w-2xl text-tf-white">
        Our Chocolate Got Stuck In The Works
      </Headline>

      <BodyText className="max-w-md text-tf-white/80">
        Something went sideways loading this collection. Give it another go, or
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
