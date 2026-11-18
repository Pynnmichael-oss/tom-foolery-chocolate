/**
 * The Mischief Society — a six-month chocolate membership sold only over
 * Black Friday – Cyber Monday. Everything date- or product-specific lives
 * here so next season is an edit to this file, not a hunt through
 * components.
 *
 * Plain constants only (no imports): shared by client components, Server
 * Actions, lib/gift-builder/sets.ts and the daily gift-email cron.
 */

/** Shopify product handle. One payment, two variants (3 Bars / 6 Bars). */
export const MISCHIEF_SOCIETY_HANDLE = "chocolate-of-the-month-club";

/** How order lines are recognized as memberships (by the gift job and
 * member pages). Order data only: matching on the line's product would need
 * the read_products scope. A line matches on SKU, or on title as a backup
 * if a SKU is ever changed. Add next season's SKUs here. */
export const MEMBERSHIP_SKUS: readonly string[] = ["COTM-3-6", "COTM-6-6"];
export const MEMBERSHIP_TITLE_PREFIX = "The Mischief Society";

export const MISCHIEF_SOCIETY_PATH = "/mischief-society";

/** Members' welcome page (how membership works + "email me my link"). */
export const MISCHIEF_SOCIETY_WELCOME_PATH = "/mischief-society/welcome";
/** Private member pages live at /mischief-society/member/<token>. */
export const MISCHIEF_SOCIETY_MEMBER_PATH = "/mischief-society/member";

/** In-page anchors. Landing on JOIN_GIFT_ANCHOR preselects "Gifting". */
export const JOIN_ANCHOR = "join";
export const JOIN_GIFT_ANCHOR = "join-gift";

/** Sale window, Chicago time. Add to Cart is only live in between. */
export const SALE_OPENS_AT = "2026-11-27T00:00:00-06:00";
export const SALE_CLOSES_AT = "2026-11-30T23:59:59-06:00";

/** Shown as plain copy ("Doors open Black Friday, 11/27"). */
export const SALE_OPENS_LABEL = "Black Friday, 11/27";
export const SALE_CLOSES_LABEL = "Cyber Monday, 11/30";

/** Membership months — members pick their bars from a monthly email. */
export const MEMBERSHIP_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] as const;
export const MEMBERSHIP_YEAR = 2027;

/** Gift emails can go out any day from today (the day of purchase)
 * through Dec 31, so every recipient is on the member list before the
 * January pick-your-bars email. GIFT_DATE_MIN is only a floor under
 * "today": set to the start of pre-launch testing so test orders can use
 * today's date. It also starts the order window the daily gift job reads.
 * YYYY-MM-DD, compared as strings. */
export const GIFT_DATE_MIN = "2026-11-18";
export const GIFT_DATE_MAX = "2026-12-31";
export const GIFT_DATE_DEFAULT = "2026-12-25";

export const GIFT_NOTE_MAX = 200;

/** Stands in for the gift note when the buyer leaves it blank: in the
 * checkout preview and on the membership card in the gift email. */
export const DEFAULT_GIFT_NOTE =
  "Consider this your official invitation to six months of chocolate mischief. And don\u2019t worry, the secret handshake is optional.";
export const NAME_MAX = 40;

/** Timezone the gift dates are read in (and the cron's "today"). */
export const SOCIETY_TIMEZONE = "America/Chicago";

export type TierBars = 3 | 6;

export interface TierInfo {
  bars: TierBars;
  name: string;
  /** Matched against the Shopify variant's "Bars per Month" value. */
  optionValue: string;
  /** Fallback while the product isn't readable (draft / not published to
   * the Headless channel). The real price comes from Shopify. */
  fallbackPrice: number;
}

export const TIERS: readonly TierInfo[] = [
  { bars: 3, name: "The Taster", optionValue: "3 Bars", fallbackPrice: 155 },
  { bars: 6, name: "The Ringleader", optionValue: "6 Bars", fallbackPrice: 295 },
];

/** Cart line attribute keys — they become line item properties on the
 * order, which is what the daily gift-email job reads back. Changing a key
 * after orders exist would orphan those orders, so don't. */
export const GIFT_ATTR = {
  recipientName: "Gift for",
  recipientEmail: "Recipient email",
  sendDate: "Send gift email on",
  note: "Gift note",
  from: "From",
} as const;

/** Omnisend: every member gets this tag; the monthly pick-your-bars email
 * goes to it. */
export const OMNISEND_MEMBER_TAG = `mischief-society-${MEMBERSHIP_YEAR}`;
/** Omnisend tag for the pre-sale "email me when doors open" signup. */
export const OMNISEND_LAUNCH_ALERT_TAG = "mischief-society-launch-alert";
/** In-page anchor for that signup form. */
export const NOTIFY_ANCHOR = "notify";

/** Custom events the Omnisend automations trigger on. */
export const OMNISEND_EVENTS = {
  /** Sent to the recipient on their gift date — the gift email itself. */
  giftDelivered: "mischief society gift delivered",
  /** Sent to the buyer once a recipient's email has gone out. */
  giftSentBuyerCopy: "mischief society gift sent",
  /** Sent to a member with their private member-page link: the welcome
   * email for "for me" members, and the "email me my link" resend. */
  memberLink: "mischief society member link",
} as const;

export type SalePhase = "pre" | "live" | "closed";

/** Adding ?test to the page URL opens checkout regardless of the sale
 * dates, for testing on the live site before 11/27. Not linked anywhere. */
export const TEST_MODE_PARAM = "test";

export function salePhase(now: number = Date.now()): SalePhase {
  if (now < Date.parse(SALE_OPENS_AT)) return "pre";
  if (now <= Date.parse(SALE_CLOSES_AT)) return "live";
  return "closed";
}

/** Today's date (YYYY-MM-DD) in the Society's timezone. */
export function societyToday(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SOCIETY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
