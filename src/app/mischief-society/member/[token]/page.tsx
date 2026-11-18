import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { EyesHatIcon } from "@/components/ui/logos";
import { MemberAddressForm } from "@/components/mischief-society/MemberAddressForm";
import {
  MEMBERSHIP_MONTHS,
  MEMBERSHIP_YEAR,
  MISCHIEF_SOCIETY_WELCOME_PATH,
} from "@/lib/mischief-society/config";
import { readMemberToken } from "@/lib/mischief-society/member-links";
import { getMembership, type Membership } from "@/lib/mischief-society/members";

/**
 * A member's private page, reached only through their member link. The
 * signed token in the URL is the key (see lib/mischief-society/
 * member-links.ts). Shows the membership and lets the member add or change
 * their shipping address. Monthly bar picks will live here too.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Mischief Society Membership",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

async function load(token: string): Promise<Membership | null> {
  const ids = readMemberToken(token);
  if (!ids) return null;
  try {
    return await getMembership(ids.orderGid, ids.lineGid);
  } catch (error) {
    console.error("[mischief-society] member page lookup failed:", error);
    return null;
  }
}

export default async function MemberPage(props: PageProps<"/mischief-society/member/[token]">) {
  const { token } = await props.params;
  const membership = await load(token);

  if (!membership) return <LinkProblem />;

  const firstName = membership.memberName.split(/\s+/)[0];
  const months = `${MEMBERSHIP_MONTHS[0]} – ${MEMBERSHIP_MONTHS[MEMBERSHIP_MONTHS.length - 1]} ${MEMBERSHIP_YEAR}`;

  return (
    <main id="main-content">
      <section className="bg-tf-juniper px-fluid-md py-fluid-xl text-tf-black">
        <div className="mx-auto flex max-w-4xl flex-col gap-fluid-sm">
          <Preheader>The Mischief Society · Member</Preheader>
          <Headline as="h1" size="md">
            {`Hi, ${firstName}.`}
          </Headline>
          <BodyText size="lg" className="max-w-2xl">
            {membership.isGift && membership.giftedBy
              ? `${membership.giftedBy} made you a member. This is your corner of the Society: where your chocolate ships and, starting in January, what goes in the box.`
              : "This is your corner of the Society: where your chocolate ships and, starting in January, what goes in the box."}
          </BodyText>
        </div>
      </section>

      <section className="px-fluid-md py-fluid-xl">
        <div className="mx-auto grid max-w-4xl gap-fluid-md md:grid-cols-[0.8fr_1.2fr]">
          {/* Membership summary */}
          <div className="flex flex-col gap-4 self-start rounded-2xl bg-tf-black p-6 text-tf-white">
            <div className="flex items-center justify-between gap-3">
              <Preheader size="sm">Your Membership</Preheader>
              <EyesHatIcon className="h-auto w-10 text-tf-white" aria-hidden="true" />
            </div>
            <dl className="flex flex-col gap-3">
              <div>
                <dt className="text-xs font-black tracking-[0.075em] text-tf-white/70 uppercase">Box size</dt>
                <dd className="font-display text-2xl font-semibold">
                  {membership.bars ? `${membership.bars} bars a month` : "Monthly box"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-black tracking-[0.075em] text-tf-white/70 uppercase">Boxes</dt>
                <dd className="font-display text-2xl font-semibold">6, {months}</dd>
              </div>
              {membership.isGift && membership.giftedBy && (
                <div>
                  <dt className="text-xs font-black tracking-[0.075em] text-tf-white/70 uppercase">A gift from</dt>
                  <dd className="font-display text-2xl font-semibold">{membership.giftedBy}</dd>
                </div>
              )}
            </dl>
            <p className="border-t border-tf-white/20 pt-3 text-sm text-tf-white/75">
              Bookmark this page. It&rsquo;s your private member link, so keep it to yourself.
            </p>
          </div>

          <div className="flex flex-col gap-fluid-md">
            {/* Shipping address */}
            <div className="flex flex-col gap-4 rounded-2xl border-2 border-tf-black p-6">
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-2xl font-semibold">Where should we send it?</h2>
                <p className="text-sm text-tf-black/70">
                  {membership.record.address
                    ? "Moving or traveling? Update it any time before a box ships."
                    : "Add your shipping address so your first box knows where to go."}
                </p>
              </div>
              <MemberAddressForm token={token} initial={membership.record.address ?? null} />
            </div>

            {/* Monthly picks (coming in January) */}
            <div className="flex flex-col gap-2 rounded-2xl bg-tf-rose/40 p-6">
              <h2 className="font-display text-2xl font-semibold">Your monthly picks</h2>
              <p>
                Picks open in early January. We&rsquo;ll email you when the first lineup is ready, and
                you&rsquo;ll choose your bars right here. Want more? Members can add extra bars to any
                month&rsquo;s box at 10% off.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-fluid-md pb-fluid-2xl">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 border-t-2 border-tf-black pt-fluid-sm">
          <p className="text-sm">Questions? Reply to any Society email, or get in touch.</p>
          <div className="flex flex-wrap gap-3">
            <Link href={MISCHIEF_SOCIETY_WELCOME_PATH} className={buttonClasses("secondary")}>
              How it works
            </Link>
            <Link href="/contact" className={buttonClasses("secondary")}>
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function LinkProblem() {
  return (
    <main id="main-content">
      <section className="px-fluid-md py-fluid-2xl">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-fluid-sm text-center">
          <Preheader>The Mischief Society</Preheader>
          <Headline as="h1" size="md">
            This Link Isn&rsquo;t Working
          </Headline>
          <BodyText className="max-w-lg">
            It may be incomplete or out of date. Enter your email on the welcome page and we&rsquo;ll
            send you a fresh member link.
          </BodyText>
          <Link href={`${MISCHIEF_SOCIETY_WELCOME_PATH}#find-membership`} className={buttonClasses("primary")}>
            Get a new link
          </Link>
        </div>
      </section>
    </main>
  );
}
