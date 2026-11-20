import type { CartAttribute } from "@/lib/shopify/types";
import {
  GIFT_ATTR,
  GIFT_DATE_MAX,
  GIFT_DATE_MIN,
  GIFT_NOTE_MAX,
  NAME_MAX,
} from "./config";

/** Same pattern as lib/forms/shared.ts, plus a 2+ letter TLD. Kept local so
 * this file stays safe to import from client components. */
export const GIFT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface GiftRecipient {
  name: string;
  email: string;
  /** YYYY-MM-DD */
  sendDate: string;
  note: string;
}

export interface GiftProblem {
  /** Index into the recipients array. */
  index: number;
  field: "name" | "email" | "sendDate" | "note";
  message: string;
}

/** Validates every recipient; the page shows each problem on its field.
 * `today` (YYYY-MM-DD) moves the earliest allowed date forward once the
 * sale is underway — no scheduling an email for yesterday. */
export function validateRecipients(recipients: GiftRecipient[], today: string): GiftProblem[] {
  const problems: GiftProblem[] = [];
  const seen = new Set<string>();
  const earliest = today > GIFT_DATE_MIN ? today : GIFT_DATE_MIN;

  recipients.forEach((r, index) => {
    if (!r.name.trim()) problems.push({ index, field: "name", message: "Add their name." });
    else if (r.name.trim().length > NAME_MAX)
      problems.push({ index, field: "name", message: `Keep their name under ${NAME_MAX} characters.` });

    const email = r.email.trim().toLowerCase();
    if (!GIFT_EMAIL_RE.test(email)) {
      problems.push({ index, field: "email", message: "Check the email address." });
    } else if (seen.has(email)) {
      problems.push({ index, field: "email", message: "This email is already on your list." });
    }
    seen.add(email);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.sendDate) || r.sendDate < earliest || r.sendDate > GIFT_DATE_MAX) {
      problems.push({
        index,
        field: "sendDate",
        message: `Pick a date from ${formatGiftDate(earliest)} to ${formatGiftDate(GIFT_DATE_MAX)}.`,
      });
    }

    if (r.note.length > GIFT_NOTE_MAX)
      problems.push({ index, field: "note", message: `Keep the note under ${GIFT_NOTE_MAX} characters.` });
  });

  return problems;
}

/** Cart line attributes for one gift. Fixed key order on purpose — see
 * lib/shopify/cart-attributes.ts on why attribute order matters. */
export function giftAttributes(r: GiftRecipient, from: string): CartAttribute[] {
  const attrs: CartAttribute[] = [
    { key: GIFT_ATTR.recipientName, value: r.name.trim() },
    { key: GIFT_ATTR.recipientEmail, value: r.email.trim() },
    { key: GIFT_ATTR.sendDate, value: r.sendDate },
  ];
  if (from.trim()) attrs.push({ key: GIFT_ATTR.from, value: from.trim() });
  if (r.note.trim()) attrs.push({ key: GIFT_ATTR.note, value: r.note.trim() });
  return attrs;
}

/** Reads a gift back off an order line's attributes. `null` for a
 * "for me" membership (no recipient email). */
export function readGift(
  attributes: CartAttribute[]
): (GiftRecipient & { from: string }) | null {
  const get = (key: string) => attributes.find((a) => a.key === key)?.value?.trim() ?? "";
  const email = get(GIFT_ATTR.recipientEmail);
  if (!email) return null;
  return {
    name: get(GIFT_ATTR.recipientName),
    email,
    sendDate: get(GIFT_ATTR.sendDate),
    note: get(GIFT_ATTR.note),
    from: get(GIFT_ATTR.from),
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-12-25" → "Dec 25" */
export function formatGiftDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`;
}

/** Loose date parsing for the "paste a list" box: 12/25, 12/25/2026,
 * 2026-12-25, Dec 25, December 25. Year defaults to the gift year. */
export function parseLooseDate(input: string, year = Number(GIFT_DATE_MIN.slice(0, 4))): string | null {
  const s = input.trim();
  if (!s) return null;
  const pad = (n: string | number) => String(n).padStart(2, "0");
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/.exec(s);
  if (m) {
    const y = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : year;
    return `${y}-${pad(m[1])}-${pad(m[2])}`;
  }
  m = /^([A-Za-z]{3})[A-Za-z]*\.?\s+(\d{1,2})$/.exec(s);
  if (m) {
    const i = MONTHS.findIndex((x) => x.toLowerCase() === m![1].toLowerCase());
    if (i >= 0) return `${year}-${pad(i + 1)}-${pad(m[2])}`;
  }
  return null;
}

/** "Name, email, date" lines (comma or tab separated, any order) → rows.
 * Lines without an email are counted as skipped. */
export function parseRecipientList(
  text: string,
  fallbackDate: string
): { rows: Array<Pick<GiftRecipient, "name" | "email" | "sendDate">>; skipped: number } {
  const rows: Array<Pick<GiftRecipient, "name" | "email" | "sendDate">> = [];
  let skipped = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parts = line.split(/\t|,/).map((p) => p.trim()).filter(Boolean);
    const email = parts.find((p) => GIFT_EMAIL_RE.test(p));
    if (!email) {
      skipped++;
      continue;
    }
    let name = "";
    let sendDate: string | null = null;
    for (const p of parts) {
      if (p === email) continue;
      const d: string | null = sendDate ? null : parseLooseDate(p);
      if (d) sendDate = d;
      else if (!name) name = p;
    }
    rows.push({ name, email, sendDate: sendDate ?? fallbackDate });
  }
  return { rows, skipped };
}
