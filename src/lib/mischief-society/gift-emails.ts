import { createHash } from "node:crypto";
import { adminFetch } from "@/lib/shopify/admin";
import { sendCustomEvent, upsertContact } from "@/lib/omnisend/server";
import { DEFAULT_GIFT_NOTE, OMNISEND_EVENTS, OMNISEND_MEMBER_TAG } from "./config";
import { formatGiftDate, readGift } from "./gifts";
import { isMemberLinkConfigured, memberUrl } from "./member-links";
import {
  GIFTS_SENT_KEY,
  METAFIELD_NAMESPACE,
  barsFrom,
  fetchMembershipOrders,
  isMembershipLine,
} from "./members";

/**
 * The daily Mischief Society job (run by /api/cron/mischief-society-gifts):
 *
 *  1. Reads paid, uncancelled orders placed during the sale that contain
 *     the membership product.
 *  2. Gift lines whose send date is today or earlier (so a missed day
 *     catches up) and not yet sent: adds the recipient to Omnisend with
 *     the member tag and their private member link, fires the "gift
 *     delivered" event (their gift email) and the "gift sent" event to
 *     the buyer.
 *  3. "For me" lines: adds the buyer to Omnisend with the member tag and
 *     member link, and fires the "member link" event (their welcome email
 *     with the link to add a shipping address).
 *  4. Records every handled line ID on the order in the metafield
 *     mischief_society.gifts_sent, so a re-run never sends twice.
 *
 * Gift recipients join the member list only on their send date, so the
 * surprise isn't spoiled by an early list email.
 */

const METAFIELDS_SET = /* GraphQL */ `
  mutation MarkGiftsSent($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      userErrors { field message }
    }
  }
`;

/** A stable UUID-shaped ID per (line, event), passed to Omnisend. */
function eventId(lineId: string, event: string): string {
  const h = createHash("sha256").update(`${lineId}|${event}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function parseSent(value: string | undefined): Set<string> {
  if (!value) return new Set();
  try {
    const parsed: unknown = JSON.parse(value);
    return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

export interface GiftRunResult {
  today: string;
  dryRun: boolean;
  ordersScanned: number;
  giftsSent: Array<{ order: string; sendDate: string }>;
  membersAdded: Array<{ order: string }>;
  giftsWaiting: number;
  warnings: string[];
  failures: Array<{ order: string; line: string; error: string }>;
}

export async function runGiftEmails({
  today,
  dryRun = false,
}: {
  today: string;
  dryRun?: boolean;
}): Promise<GiftRunResult> {
  const result: GiftRunResult = {
    today,
    dryRun,
    ordersScanned: 0,
    giftsSent: [],
    membersAdded: [],
    giftsWaiting: 0,
    warnings: [],
    failures: [],
  };

  const linksOn = isMemberLinkConfigured();
  if (!linksOn) result.warnings.push("Member links are off: set MEMBER_LINK_SECRET (or CRON_SECRET).");

  for (const order of await fetchMembershipOrders()) {
    const lines = order.lineItems.nodes.filter(isMembershipLine);
    if (order.cancelledAt || lines.length === 0) continue;
    result.ordersScanned++;

    const sent = parseSent(order.metafield?.value);
    const handledNow: string[] = [];
    const buyerFirst = order.buyer?.firstName?.trim() || "";
    const buyerLast = order.buyer?.lastName?.trim() || "";

    for (const line of lines) {
      if (sent.has(line.id)) continue;
      const bars = barsFrom(line.variantTitle);
      const gift = readGift(line.customAttributes);

      try {
        if (gift) {
          if (!gift.sendDate || gift.sendDate > today) {
            result.giftsWaiting++;
            continue;
          }
          const [firstName, ...rest] = gift.name.split(/\s+/);
          const from = gift.from || [buyerFirst, buyerLast].filter(Boolean).join(" ") || "A friend";
          const link = linksOn ? memberUrl(order.id, line.id) : "";
          if (!dryRun) {
            await upsertContact({
              email: gift.email,
              firstName: firstName || undefined,
              lastName: rest.join(" ") || undefined,
              tags: [OMNISEND_MEMBER_TAG, "source: mischief-society-gift"],
              customProperties: {
                ...(bars ? { society_bars: bars } : {}),
                society_memberships: line.currentQuantity,
                society_gifted_by: from,
                ...(link ? { society_member_link: link } : {}),
              },
            });
            await sendCustomEvent({
              name: OMNISEND_EVENTS.giftDelivered,
              email: gift.email,
              eventID: eventId(line.id, OMNISEND_EVENTS.giftDelivered),
              properties: {
                recipient_name: gift.name,
                recipient_first_name: firstName || gift.name,
                from,
                // The email's membership card always shows a note.
                note: gift.note || DEFAULT_GIFT_NOTE,
                bars_per_month: bars ?? "",
                order: order.name,
                member_link: link,
              },
            });
            if (order.email) {
              await sendCustomEvent({
                name: OMNISEND_EVENTS.giftSentBuyerCopy,
                email: order.email,
                eventID: eventId(line.id, OMNISEND_EVENTS.giftSentBuyerCopy),
                properties: {
                  recipient_name: gift.name,
                  send_date: formatGiftDate(gift.sendDate),
                  note: gift.note,
                  order: order.name,
                },
              });
            }
          }
          if (!order.email) {
            result.warnings.push(
              `${order.name}: no buyer email visible to the Admin API token, so the buyer copy was skipped.`
            );
          }
          result.giftsSent.push({ order: order.name, sendDate: gift.sendDate });
        } else {
          if (!order.email) {
            result.warnings.push(`${order.name}: "for me" membership but no buyer email visible to the token.`);
            continue;
          }
          if (!dryRun) {
            await upsertContact({
              email: order.email,
              firstName: buyerFirst || undefined,
              lastName: buyerLast || undefined,
              tags: [OMNISEND_MEMBER_TAG, "source: mischief-society"],
              customProperties: {
                ...(bars ? { society_bars: bars } : {}),
                society_memberships: line.currentQuantity,
                ...(linksOn ? { society_member_link: memberUrl(order.id, line.id) } : {}),
              },
            });
            if (linksOn) {
              await sendCustomEvent({
                name: OMNISEND_EVENTS.memberLink,
                email: order.email,
                eventID: eventId(line.id, OMNISEND_EVENTS.memberLink),
                properties: {
                  first_name: buyerFirst || "friend",
                  bars_per_month: bars ?? "",
                  member_link: memberUrl(order.id, line.id),
                  order: order.name,
                },
              });
            }
          }
          result.membersAdded.push({ order: order.name });
        }
        handledNow.push(line.id);
      } catch (error) {
        result.failures.push({
          order: order.name,
          line: line.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (handledNow.length && !dryRun) {
      const value = JSON.stringify([...sent, ...handledNow]);
      try {
        const res = await adminFetch<{
          metafieldsSet: { userErrors: Array<{ field: string[] | null; message: string }> };
        }>(METAFIELDS_SET, {
          metafields: [
            { ownerId: order.id, namespace: METAFIELD_NAMESPACE, key: GIFTS_SENT_KEY, type: "json", value },
          ],
        });
        const errs = res.metafieldsSet.userErrors;
        if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
      } catch (error) {
        // The emails went out but weren't recorded: tomorrow's run would
        // send them again, so make this loud.
        result.failures.push({
          order: order.name,
          line: "metafield",
          error: `Sent but could not record as sent: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }
  }

  return result;
}
