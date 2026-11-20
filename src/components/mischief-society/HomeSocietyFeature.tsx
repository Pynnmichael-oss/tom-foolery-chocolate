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
  SALE_CLOSES_AT,
  SALE_CLOSES_LABEL,
  SALE_OPENS_AT,
  SALE_OPENS_LABEL,
  type SalePhase,
} from "@/lib/mischief-society/config";
import { MembershipCard } from "./SocietySections";
import { useSalePhase } from "./useSalePhase";

/**
 * How the homepage fits the Mischief Society around the gift set, so a
 * visitor never sees two offers shouting at once:
 *
 * - Before Black Friday: the gift set keeps the hero button and the lead
 *   feature. The Society shows up once, lower down, as a teaser with the
 *   countdown to doors opening and a "get the heads-up" link.
 * - During the sale (11/27 – 11/30): the Society takes over the hero
 *   button and moves into the lead slot with a "closes in" countdown. The
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
  const { phase, now } = useSalePhase(initialPhase);
  const society = phase === "closed" ? null : <SocietyFeature phase={phase} now={now} />;

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

function SocietyFeature({ phase, now }: { phase: Exclude<SalePhase, "closed">; now: number | null }) {
  const live = phase === "live";
  const target = Date.parse(live ? SALE_CLOSES_AT : SALE_OPENS_AT);

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
              : "A box of bars every month, January through June, with member-only flavors you won’t find anywhere else. Memberships go on sale Black Friday and only stay open four days."}
          </BodyText>

          <Countdown label={live ? "Doors close in" : "Doors open in"} target={target} now={now} />

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

function Countdown({ label, target, now }: { label: string; target: number; now: number | null }) {
  // Blank tiles until the browser knows the time, so the server HTML and
  // the first client render match.
  const ms = now === null ? null : Math.max(0, target - now);
  const parts: Array<[string, number | null]> = [
    ["Days", ms === null ? null : Math.floor(ms / 864e5)],
    ["Hours", ms === null ? null : Math.floor((ms % 864e5) / 36e5)],
    ["Minutes", ms === null ? null : Math.floor((ms % 36e5) / 6e4)],
  ];

  return (
    <div className="flex flex-col gap-2" role="timer" aria-live="off">
      <p className="font-sans text-xs font-black uppercase tracking-[0.2em] text-tf-turmeric">{label}</p>
      <div className="flex gap-2">
        {parts.map(([unit, value]) => (
          <div
            key={unit}
            className="flex min-w-[4.5rem] flex-col items-center rounded-xl bg-tf-white px-3 py-2 text-tf-black"
          >
            <span className="font-display text-3xl font-semibold tabular-nums leading-none sm:text-4xl">
              {value === null ? "–" : String(value).padStart(2, "0")}
            </span>
            <span className="mt-1 font-sans text-[0.65rem] font-bold uppercase tracking-wider text-tf-black/70">
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
