import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import {
  MembershipCard,
  SocietyTimeline,
  StripeBand,
} from "@/components/mischief-society/SocietySections";
import { MEMBERSHIP_YEAR, MISCHIEF_SOCIETY_WELCOME_PATH } from "@/lib/mischief-society/config";

const TITLE = "Welcome to the Mischief Society";
const DESCRIPTION =
  "You're a member. Here's how your six months of Tom Foolery chocolate work: pick your bars each month, January through June.";

/**
 * Landing page for members, mainly people who were *given* a membership:
 * the gift email's button points here. No selling — it explains what
 * happens next. Kept out of search and the sitemap: it's for members who
 * arrive from that email, not for shoppers (who belong on
 * /mischief-society).
 */
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: MISCHIEF_SOCIETY_WELCOME_PATH },
  robots: { index: false, follow: true },
};

const NEXT_STEPS = [
  {
    when: "Now",
    title: "You're on the list",
    body: "Your membership is set and paid for. There's nothing to sign up for and nothing to pay.",
  },
  {
    when: "Early January",
    title: "Your first pick-your-bars email",
    body: "We email you that month's lineup: our full range of bars plus the member-only flavors.",
  },
  {
    when: "When it lands",
    title: "Pick your bars, tell us where",
    body: "Choose your bars and give us your shipping address. You can use a different address any month.",
  },
  {
    when: "Every month",
    title: "Your box ships",
    body: `A new email and a new box each month, six in all, through June ${MEMBERSHIP_YEAR}.`,
  },
];

const MEMBER_FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Do I need to pay for anything?",
    a: "No. Your membership is already paid for, including all six boxes. Nothing renews and there's nothing to cancel.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. Everything happens by email. Just watch your inbox in early January.",
  },
  {
    q: "Where will my chocolate ship?",
    a: "Wherever you tell us when you pick your bars each month. If you move or travel, enter the new address with that month's picks.",
  },
  {
    q: "How many bars do I get?",
    a: "Your gift email says how many bars a month your membership includes: three or six.",
  },
  {
    q: "What are member-only flavors?",
    a: "Bars we make just for the Society. They aren't sold on our site or in stores.",
  },
  {
    q: "Who do I contact with questions?",
    a: "Reply to any Mischief Society email, or reach us through our contact page.",
  },
];

export default function MischiefSocietyWelcomePage() {
  return (
    <main id="main-content">
      {/* Hero */}
      <section className="overflow-hidden bg-tf-juniper text-tf-black">
        <div className="mx-auto grid max-w-7xl items-center gap-fluid-lg px-fluid-md py-fluid-xl md:grid-cols-[1.05fr_0.95fr]">
          <div className="flex min-w-0 flex-col gap-fluid-sm">
            <Preheader>The Mischief Society · Members</Preheader>
            <Headline as="h1" size="lg" className="text-balance">
              Welcome to the Society.
            </Headline>
            <BodyText size="lg" className="max-w-xl">
              Someone thinks you deserve six months of chocolate. From January through June, you
              pick a box of bars every month, including member-only flavors nobody else gets to
              try. Here&rsquo;s how it works.
            </BodyText>
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
      <StripeBand />

      {/* What happens next */}
      <section className="px-fluid-md py-fluid-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-fluid-lg">
          <div className="flex flex-col gap-fluid-xs">
            <Preheader>What Happens Next</Preheader>
            <Headline as="h2" size="md">
              You Don&rsquo;t Have to Do a Thing Until January
            </Headline>
          </div>
          <ol className="grid gap-fluid-sm sm:grid-cols-2 lg:grid-cols-4">
            {NEXT_STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-2 rounded-2xl bg-tf-rose/40 p-6">
                <span className="font-display text-5xl leading-none font-semibold text-tf-cinnamon-strong">
                  {i + 1}
                </span>
                <span className="font-sans text-xs font-black tracking-[0.075em] uppercase">
                  {step.when}
                </span>
                <h3 className="font-display text-2xl leading-tight font-semibold">{step.title}</h3>
                <BodyText size="sm">{step.body}</BodyText>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <SocietyTimeline />

      {/* Member FAQ */}
      <section className="px-fluid-md py-fluid-2xl">
        <div className="mx-auto flex max-w-3xl flex-col gap-fluid-lg">
          <div className="flex flex-col items-center gap-fluid-xs text-center">
            <Preheader>For Members</Preheader>
            <Headline as="h2" size="md">
              Questions
            </Headline>
          </div>
          <div className="flex flex-col">
            {MEMBER_FAQS.map((item) => (
              <details key={item.q} className="group border-b-2 border-tf-black">
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

      {/* Closing */}
      <section className="bg-tf-turmeric px-fluid-md py-fluid-2xl text-center text-tf-black">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-fluid-sm">
          <Preheader>Until January</Preheader>
          <Headline as="h2" size="md">
            Watch Your Inbox
          </Headline>
          <BodyText className="max-w-xl">
            Your first pick-your-bars email arrives in early January. Can&rsquo;t wait that long?
            Our regular lineup is always open.
          </BodyText>
          <div className="mt-fluid-xs flex flex-wrap justify-center gap-fluid-sm">
            <Link href="/shop" className={buttonClasses("primary")}>
              Browse the Bars
            </Link>
            <Link href="/contact" className={buttonClasses("secondary")}>
              Contact Us
            </Link>
          </div>
          <p className="font-display text-3xl italic">&ndash;Tom</p>
        </div>
      </section>
      <StripeBand />
    </main>
  );
}
