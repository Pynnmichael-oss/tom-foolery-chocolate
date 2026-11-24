"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Hero, type HeroProps } from "@/components/sections/Hero";
import {
  JOIN_ANCHOR,
  JOIN_GIFT_ANCHOR,
  MISCHIEF_SOCIETY_PATH,
  NOTIFY_ANCHOR,
  SALE_CLOSES_LABEL,
  SALE_OPENS_LABEL,
  type SalePhase,
} from "@/lib/mischief-society/config";
import { MembershipCard } from "./SocietySections";
import { useSalePhase } from "./useSalePhase";

/**
 * How the homepage fits the Mischief Society around the gift set, so a
 * visitor never sees two offers shouting at once:
 *
 * - Before doors open: the gift set keeps the hero button and the lead
 *   feature. The Society shows up once, lower down, as a teaser with the
 *   note that doors open soon and a "get the heads-up" link.
 * - During the sale (11/24 – 11/30): the Society takes over the hero
 *   button and moves into the lead slot (no countdown). The
 *   gift set drops to second, as the quick gift for this week.
 * - After Cyber Monday: the Society disappears and the page is back to
 *   normal.
 *
 * Phase is re-checked in the browser (useSalePhase), so the swap happens
 * on time even though the page itself is cached. ?test previews the
 * during-sale layout.
 */
export function HomeOffers({
  initialPhase,
  giftSet,
  rest,
}: {
  initialPhase: SalePhase;
  /** The gift set feature, server-rendered (null when it isn't live). */
  giftSet: ReactNode;
  /** Everything below the offers. */
  rest: ReactNode;
}) {
  const { phase } = useSalePhase(initialPhase);
  const society = phase === "closed" ? null : <SocietyFeature phase={phase} />;

  return phase === "live" ? (
    <>
      {society}
      {giftSet}
      {rest}
    </>
  ) : (
    <>
      {giftSet}
      {society}
      {rest}
    </>
  );
}

/** The homepage hero, with its one button given to whichever offer leads:
 * the Society while doors are open, the gift set (from Shopify) otherwise. */
export function HomeHero({
  initialPhase,
  giftSetCta,
  ...hero
}: Omit<HeroProps, "cta"> & { initialPhase: SalePhase; giftSetCta?: HeroProps["cta"] }) {
  const { phase } = useSalePhase(initialPhase);
  const cta =
    phase === "live" ? { label: "Join the Mischief Society", href: MISCHIEF_SOCIETY_PATH } : giftSetCta;
  return <Hero {...hero} cta={cta} />;
}

function SocietyFeature({ phase }: { phase: Exclude<SalePhase, "closed"> }) {
  const live = phase === "live";

  return (
    <section
      aria-label="The Mischief Society"
      className="overflow-hidden bg-tf-black px-fluid-md py-fluid-xl text-tf-white"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-fluid-lg md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex min-w-0 flex-col items-start gap-fluid-sm">
          <Preheader className="text-tf-turmeric">
            {live ? "The Mischief Society · Doors Are Open" : `The Mischief Society · Opens ${SALE_OPENS_LABEL}`}
          </Preheader>
          <Headline as="h2" size="md" className="text-balance">
            {live ? "Six Months of Mischief. Doors Close Cyber Monday." : "Six Months of Mischief, Coming Soon."}
          </Headline>
          <BodyText className="max-w-lg text-tf-white/85">
            {live
              ? `A box of bars every month, January through June, with member-only flavors you won’t find anywhere else. Join or gift a membership before ${SALE_CLOSES_LABEL} at midnight.`
              : `A box of bars every month, January through June, with member-only flavors you won’t find anywhere else. Memberships go on sale ${SALE_OPENS_LABEL} and close ${SALE_CLOSES_LABEL}.`}
          </BodyText>

          <div className="mt-fluid-xs flex flex-wrap items-center gap-x-fluid-sm gap-y-3">
            {live ? (
              <>
                <Link href={`${MISCHIEF_SOCIETY_PATH}#${JOIN_ANCHOR}`} className={buttonClasses("primary")}>
                  Join the Society
                </Link>
                <Link
                  href={`${MISCHIEF_SOCIETY_PATH}#${JOIN_GIFT_ANCHOR}`}
                  className="font-sans text-sm font-semibold underline decoration-2 underline-offset-4 hover:text-tf-turmeric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-white"
                >
                  Or gift a membership&nbsp;→
                </Link>
              </>
            ) : (
              <>
                <Link href={`${MISCHIEF_SOCIETY_PATH}#${NOTIFY_ANCHOR}`} className={buttonClasses("primary")}>
                  Get the Heads-Up
                </Link>
                <Link
                  href={MISCHIEF_SOCIETY_PATH}
                  className="font-sans text-sm font-semibold underline decoration-2 underline-offset-4 hover:text-tf-turmeric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-white"
                >
                  See what members get&nbsp;→
                </Link>
              </>
            )}
          </div>
        </div>

        <div aria-hidden="true" className="relative mx-auto w-full max-w-sm pb-24 md:pb-32">
          <MembershipCard className="-rotate-[5deg] text-tf-black" />
          <Image
            src="/photos/mischief-society-bars.webp"
            alt=""
            width={900}
            height={600}
            sizes="(min-width: 768px) 260px, 50vw"
            className="absolute right-0 bottom-0 w-[60%] max-w-[260px] rotate-[6deg] drop-shadow-[0_18px_18px_rgba(0,0,0,0.45)]"
          />
        </div>
      </div>
    </section>
  );
}

