import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { EyesHatIcon } from "@/components/ui/logos";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { SocietyActions } from "./NotifyForm";
import {
  JOIN_GIFT_ANCHOR,
  MEMBERSHIP_MONTHS,
  MEMBERSHIP_YEAR,
  SALE_CLOSES_LABEL,
  SALE_OPENS_LABEL,
  type SalePhase,
} from "@/lib/mischief-society/config";

/**
 * Static sections of /mischief-society. The interactive parts (deadline
 * ribbon, membership picker) are their own client components.
 *
 * Copy rules from the brand reference: one Power Statement per page (it's
 * in SocietyClosing), stripes only ever black and white.
 */


const STRIPES_H =
  "repeating-linear-gradient(90deg, var(--tf-black) 0 16px, var(--tf-white) 16px 32px)";

export function StripeBand() {
  return <div aria-hidden="true" className="h-4" style={{ backgroundImage: STRIPES_H }} />;
}

/* ------------------------------------------------------------------ */
/* Hero                                                                 */
/* ------------------------------------------------------------------ */

export function SocietyHero({ phase }: { phase: SalePhase }) {
  return (
    <section className="overflow-hidden bg-tf-juniper text-tf-black">
      <div className="mx-auto grid max-w-7xl items-center gap-fluid-lg px-fluid-md py-fluid-xl md:grid-cols-[1.05fr_0.95fr]">
        <div className="flex min-w-0 flex-col gap-fluid-sm">
          <Preheader>The Mischief Society · Members Only</Preheader>
          <Headline as="h1" size="lg" className="text-balance">
            Six Months of Mischief, Delivered.
          </Headline>
          <BodyText size="lg" className="max-w-xl">
            Join Tom&rsquo;s not-so-secret society of chocolate lovers. Every month from January
            through June, you pick a box of bars from our lineup plus member-only flavors you
            won&rsquo;t find on our site or in stores.
          </BodyText>
          <SocietyActions initialPhase={phase} anchor />
        </div>

        <div aria-hidden="true" className="relative mx-auto w-full max-w-md pb-28 md:pb-36">
          <MembershipCard className="-rotate-[5deg]" />
          <Image
            src="/photos/mischief-society-bars.webp"
            alt=""
            width={900}
            height={616}
            priority
            sizes="(min-width: 768px) 300px, 60vw"
            className="absolute right-0 bottom-0 w-[60%] max-w-[300px] rotate-[6deg] drop-shadow-[0_18px_18px_rgba(37,56,42,0.35)]"
          />
        </div>
      </div>
    </section>
  );
}

/** The "membership card" motif — hero, and the gift email preview. */
export function MembershipCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-[1.6/1] w-full rounded-2xl bg-tf-white p-2.5 shadow-[0_30px_50px_-20px_rgba(37,56,42,0.55)] ${className}`}
    >
      <div
        className="grid h-full grid-cols-[auto_1fr] content-center items-center gap-x-4 gap-y-1 rounded-lg px-5 py-4"
        style={{
          border: "10px solid transparent",
          borderImage:
            "repeating-linear-gradient(90deg, var(--tf-black) 0 9px, var(--tf-white) 9px 18px) 10",
        }}
      >
        <EyesHatIcon className="row-span-3 h-auto w-14 text-tf-black sm:w-20" />
        <Preheader size="sm">The Mischief Society</Preheader>
        <p className="font-display text-2xl leading-tight font-semibold sm:text-3xl">
          Official Member
        </p>
        <p className="text-xs text-tf-black/70 sm:text-sm">
          Admits one chocolate lover · Jan – Jun {MEMBERSHIP_YEAR}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Perks                                                                */
/* ------------------------------------------------------------------ */

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "h-11 w-11",
};

const PERKS: Array<{ title: string; body: string; icon: ReactNode; className: string }> = [
  {
    title: "Member-Only Flavors",
    body: "Our most curious confections, available only to Society members.",
    className: "bg-tf-turmeric text-tf-black",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="7.5" cy="15.5" r="4" />
        <path d="M10.4 12.6 20 3" />
        <path d="m16.5 6.5 3 3" />
        <path d="m14 9 2.5 2.5" />
      </svg>
    ),
  },
  {
    title: "Chocolate Curated to You",
    body: "Pick your favorites or choose from that month’s member-only flavors.",
    className: "bg-tf-rose text-tf-black",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="5" y="2.5" width="14" height="19" rx="1.5" />
        <path d="M5 8.8h14M5 15.2h14M12 2.5v19" />
      </svg>
    ),
  },
  {
    title: "The Gift That Keeps on Giving",
    body: "Made to be remembered well after it’s delivered.",
    className: "bg-tf-black text-tf-white",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3.5" y="9" width="17" height="12" rx="1.5" />
        <path d="M2.5 9h19v3.5h-19zM12 9v12" />
        <path d="M12 9C10.5 5.5 6.5 5 6.5 7.3 6.5 9 9.5 9 12 9c2.5 0 5.5 0 5.5-1.7C17.5 5 13.5 5.5 12 9z" />
      </svg>
    ),
  },
];

export function SocietyPerks() {
  return (
    <section className="px-fluid-md py-fluid-2xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-fluid-lg">
        <div className="flex flex-col gap-fluid-xs">
          <Preheader>What Members Get</Preheader>
          <Headline as="h2" size="md">
            The Perks of Membership
          </Headline>
        </div>
        <ul className="grid gap-fluid-sm md:grid-cols-3">
          {PERKS.map((perk) => (
            <li key={perk.title} className={`flex flex-col gap-3 rounded-2xl p-6 ${perk.className}`}>
              {perk.icon}
              <h3 className="font-display text-2xl leading-tight font-semibold">{perk.title}</h3>
              <BodyText size="sm">{perk.body}</BodyText>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Six-month timeline                                                   */
/* ------------------------------------------------------------------ */

/** One seasonal icon per month: a quiet nod to that month's holidays and
 * flavors, never spelled out on the page. Keyed by MEMBERSHIP_MONTHS;
 * update both together next season. Decorative (aria-hidden). */
const MONTH_ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "h-12 w-12",
};

const CLOVER_LEAF = "M12 11.6C8.4 8.8 7.9 3.4 10.7 3.6c.6 0 1 .5 1.3 1.1.3-.6.7-1.1 1.3-1.1 2.8-.2 2.3 5.2-1.3 8z";

const MONTH_ICONS: Record<(typeof MEMBERSHIP_MONTHS)[number], ReactNode> = {
  // Two glasses clinking.
  Jan: (
    <svg {...MONTH_ICON_PROPS}>
      <g transform="rotate(-14 8 12)">
        <path d="M5.5 3.5h5l-.6 6.2a1.9 1.9 0 0 1-3.8 0z" />
        <path d="M8 11.6v6.4M6 18h4" />
      </g>
      <g transform="rotate(14 16 12)">
        <path d="M13.5 3.5h5l-.6 6.2a1.9 1.9 0 0 1-3.8 0z" />
        <path d="M16 11.6v6.4M14 18h4" />
      </g>
      <path d="M12 2.2v1.6M10.3 2.8l.7.9M13.7 2.8l-.7.9" />
    </svg>
  ),
  // Heart.
  Feb: (
    <svg {...MONTH_ICON_PROPS}>
      <path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />
    </svg>
  ),
  // Clover.
  Mar: (
    <svg {...MONTH_ICON_PROPS}>
      <path d={CLOVER_LEAF} />
      <path d={CLOVER_LEAF} transform="rotate(120 12 12)" />
      <path d={CLOVER_LEAF} transform="rotate(240 12 12)" />
      <path d="M12.4 12.6c.5 3.2 1.7 6 3.8 8.4" />
    </svg>
  ),
  // Jester's cap.
  Apr: (
    <svg {...MONTH_ICON_PROPS}>
      <path d="M6.5 16.5C6 12.2 6.9 9.1 9.3 7.4 7 7.5 4.7 9 3.6 11" />
      <path d="M9.2 16.5c.6-4.6 1.4-8.6 2.8-11.3 1.4 2.7 2.2 6.7 2.8 11.3" />
      <path d="M17.5 16.5c.5-4.3-.4-7.4-2.8-9.1 2.3.1 4.6 1.6 5.7 3.6" />
      <path d="M5.5 16.5h13v3h-13z" />
      <circle cx="3.2" cy="12.2" r="1.2" />
      <circle cx="12" cy="3.9" r="1.2" />
      <circle cx="20.8" cy="12.2" r="1.2" />
    </svg>
  ),
  // Tulip.
  May: (
    <svg {...MONTH_ICON_PROPS}>
      <path d="M8 4.5 10 6.6 12 4l2 2.6 2-2.1v4.2a4 4 0 0 1-8 0z" />
      <path d="M12 12.7V21" />
      <path d="M12 18.2c-2.4-.3-4-1.8-4.6-4 2.3.2 3.9 1.6 4.6 4zM12 16.6c2.2-.3 3.7-1.7 4.2-3.8-2.1.2-3.6 1.5-4.2 3.8z" />
    </svg>
  ),
  // Sun.
  Jun: (
    <svg {...MONTH_ICON_PROPS}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
    </svg>
  ),
};

export function SocietyTimeline() {
  return (
    <section className="bg-tf-black px-fluid-md py-fluid-2xl text-tf-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-fluid-lg">
        <div className="flex flex-col gap-fluid-xs">
          <Preheader>How It Works</Preheader>
          <Headline as="h2" size="md">
            Six Months of Curious Confections
          </Headline>
          <BodyText className="max-w-2xl text-tf-white/80">
            Starting in January, we send you each month&rsquo;s lineup: our existing bars plus
            Society-exclusive flavors. You build a box to your taste, and we ship it to you.
          </BodyText>
        </div>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {MEMBERSHIP_MONTHS.map((month, i) => {
            return (
              <li
                key={month}
                className={`flex flex-col gap-2 overflow-hidden rounded-xl px-4 pt-4 text-tf-black ${
                  i === 0 ? "bg-tf-turmeric pb-4" : "bg-tf-white"
                }`}
              >
                <span className="text-xs font-black tracking-[0.075em] text-tf-black/70">
                  {MEMBERSHIP_YEAR}
                </span>
                <span className="font-display text-3xl leading-none font-semibold">{month}</span>
                <span className="py-1">{MONTH_ICONS[month]}</span>
                {i === 0 ? (
                  <span className="mt-auto pt-1 text-sm font-semibold">Your first box</span>
                ) : (
                  <span
                    aria-hidden="true"
                    className="-mx-4 mt-auto block h-9"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(90deg, var(--tf-black) 0 12px, var(--tf-white) 12px 24px)",
                    }}
                  />
                )}
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-tf-white/70">
          Each month&rsquo;s flavors stay under Tom&rsquo;s hat until that month&rsquo;s email.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Gifting explainer                                                    */
/* ------------------------------------------------------------------ */

const GIFT_STEPS = [
  {
    title: "Add your people",
    body: "One person or forty. Pick a box size for each and add a note if you like.",
  },
  {
    title: "Pick their day",
    body: "Choose when each person’s email goes out, any day through Dec 31. Christmas morning works.",
  },
  {
    title: "We take it from there",
    body: "They get an email from you on that day. In January they pick their first bars, and a box follows every month through June.",
  },
];

export function SocietyGifting() {
  return (
    <section className="bg-tf-rose px-fluid-md py-fluid-2xl text-tf-black">
      <div className="mx-auto flex max-w-7xl flex-col gap-fluid-lg">
        <div className="flex flex-col gap-fluid-xs">
          <Preheader>Gifting, Sorted</Preheader>
          <Headline as="h2" size="md">
            The Easiest Gift You&rsquo;ll Give This Year
          </Headline>
          <BodyText className="max-w-2xl">
            Buy during Black Friday weekend for as many people as you like. Each one hears about it
            on the day you choose. No wrapping, no shipping deadlines, no guessing sizes.
          </BodyText>
        </div>
        <ol className="grid gap-fluid-sm md:grid-cols-3">
          {GIFT_STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-2 rounded-2xl bg-tf-white p-6">
              <span className="font-display text-5xl leading-none font-semibold text-tf-cinnamon-strong">
                {i + 1}
              </span>
              <h3 className="font-display text-2xl leading-tight font-semibold">{step.title}</h3>
              <BodyText size="sm">{step.body}</BodyText>
            </li>
          ))}
        </ol>
        <div className="grid gap-fluid-sm md:grid-cols-3">
          <AltPath title="Don’t know their address?" href={`#${JOIN_GIFT_ANCHOR}`} cta="Start gifting">
            You don&rsquo;t need it. They give us their address when they pick their first bars in
            January.
          </AltPath>
          <AltPath title="Long list?" href={`#${JOIN_GIFT_ANCHOR}`} cta="Paste a list">
            Paste names and emails straight from a spreadsheet and set dates in one go.
          </AltPath>
          <AltPath title="Gifting a whole team?" href="/gifting" cta="Corporate gifting">
            Fifty or more, custom notes, one invoice. Our gifting crew handles it.
          </AltPath>
        </div>
      </div>
    </section>
  );
}

function AltPath({
  title,
  href,
  cta,
  children,
}: {
  title: string;
  href: string;
  cta: string;
  children: ReactNode;
}) {
  const linkClass =
    "mt-auto font-sans text-sm font-black tracking-[0.075em] uppercase underline-offset-4 hover:underline";
  return (
    <div className="flex flex-col gap-2 rounded-2xl border-2 border-tf-black p-6">
      <h3 className="font-display text-xl leading-tight font-semibold">{title}</h3>
      <BodyText size="sm">{children}</BodyText>
      {href.startsWith("#") ? (
        <a href={href} className={linkClass}>
          {cta} &rarr;
        </a>
      ) : (
        <Link href={href} className={linkClass}>
          {cta} &rarr;
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                  */
/* ------------------------------------------------------------------ */

const FAQS: Array<{ q: string; a: string; open?: boolean }> = [
  {
    q: "Is this a subscription? Will I get charged again?",
    a: "No. You pay once at checkout and that covers all six boxes. Nothing renews and there’s nothing to cancel.",
  },
  {
    q: "How does picking bars work?",
    a: "Early each month we email you the lineup: any of our existing bars plus that month’s member-only flavors. Pick your 3 or 6 bars and we ship them. First pick is in January, last is in June.",
    open: true,
  },
  {
    q: "Can I gift more than one person?",
    a: "As many as you like, in one order. Each person gets their own box size, note and email date.",
  },
  {
    q: "When will they find out?",
    a: "On the date you pick for them, we email them with your note. You’ll get a heads-up when it goes out.",
  },
  {
    q: "Do I need their address?",
    a: "No. Just their email. They enter their own shipping address when they pick their bars each month.",
  },
  {
    q: "What if they move or travel?",
    a: "They can change the address each month when they pick their bars.",
  },
  {
    q: "Can I join after Cyber Monday?",
    a: "Memberships are only sold Black Friday through Cyber Monday. Sign up for our newsletter and we’ll tell you first when the next season opens.",
  },
];

export function SocietyFaq() {
  return (
    <section className="px-fluid-md py-fluid-2xl">
      <div className="mx-auto flex max-w-3xl flex-col gap-fluid-lg">
        <div className="flex flex-col items-center gap-fluid-xs text-center">
          <Preheader>Fine Print, in Plain Print</Preheader>
          <Headline as="h2" size="md">
            Questions
          </Headline>
        </div>
        <div className="flex flex-col">
          {FAQS.map((item) => (
            <details key={item.q} open={item.open} className="group border-b-2 border-tf-black">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-display text-xl font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span aria-hidden="true" className="font-sans font-black group-open:hidden">
                  +
                </span>
                <span aria-hidden="true" className="hidden font-sans font-black group-open:inline">
                  &ndash;
                </span>
              </summary>
              <BodyText className="max-w-2xl pb-5 text-tf-black/80">{item.a}</BodyText>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Closing CTA                                                          */
/* ------------------------------------------------------------------ */

export function SocietyClosing({ phase }: { phase: SalePhase }) {
  const pre =
    phase === "pre"
      ? `Doors open ${SALE_OPENS_LABEL}`
      : phase === "live"
        ? `Doors close ${SALE_CLOSES_LABEL}`
        : "This season is full";
  return (
    <section className="bg-tf-turmeric px-fluid-md py-fluid-2xl text-center text-tf-black">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-fluid-sm">
        <Preheader>{pre}</Preheader>
        {/* The page's one Power Statement (brand reference §1). */}
        <Headline as="h2" size="md">
          Get in on the Good Stuff
        </Headline>
        <BodyText className="max-w-xl">
          Six boxes, your pick of bars every month, and flavors nobody else gets to try.
        </BodyText>
        <SocietyActions initialPhase={phase} center />
        <p className="font-display text-3xl italic">&ndash;Tom</p>
      </div>
    </section>
  );
}
