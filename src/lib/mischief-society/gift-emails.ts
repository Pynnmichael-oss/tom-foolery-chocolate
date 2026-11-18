import { createHash } from "node:crypto";
import { adminFetch } from "@/lib/shopify/admin";
import { sendCustomEvent, upsertContact } from "@/lib/omnisend/server";
import type { CartAttribute } from "@/lib/shopify/types";
import {
  GIFT_DATE_MIN,
  MISCHIEF_SOCIETY_HANDLE,
  OMNISEND_EVENTS,
  OMNISEND_MEMBER_TAG,
  SALE_CLOSES_AT,
} from "./config";
import { formatGiftDate, readGift } from "./gifts";

/**
 * The daily Mischief Society job (run by /api/cron/mischief-society-gifts):
 *
 *  1. Reads paid, uncancelled orders placed during the sale that contain
 *     the membership product.
 *  2. Gift lines whose send date is today or earlier (so a missed day
 *     catches up) and not yet sent: adds the recipient to Omnisend with
 *     the member tag, fires the "gift delivered" event (their gift email)
 *     and the "gift sent" event to the buyer.
 *  3. "For me" lines: adds the buyer to Omnisend with the member tag.
 *  4. Records every handled line ID on the order in the metafield
 *     mischief_society.gifts_sent, so a re-run never sends twice.
 *
 * Gift recipients join the member list only on their send date, so the
 * surprise isn't spoiled by an early list email.
 */

const METAFIELD_NAMESPACE = "mischief_society";
const METAFIELD_KEY = "gifts_sent";

interface OrderNode {
  id: string;
  name: string;
  cancelledAt: string | null;
  email: string | null;
  customer: { firstName: string | null; lastName: string | null } | null;
  metafield: { value: string } | null;
  lineItems: {
    nodes: Array<{
      id: string;
      currentQuantity: number;
      variantTitle: string | null;
      product: { handle: string } | null;
      customAttributes: CartAttribute[];
    }>;
  };
}

const ORDERS_QUERY = /* GraphQL */ `
  query MischiefSocietyOrders($query: String!, $after: String) {
    orders(first: 50, after: $after, query: $query, sortKey: CREATED_AT) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        name
        cancelledAt
        email
        customer { firstName lastName }
        metafield(namespace: "${METAFIELD_NAMESPACE}", key: "${METAFIELD_KEY}") { value }
        lineItems(first: 100) {
          nodes {
            id
            currentQuantity
            variantTitle
            product { handle }
            customAttributes { key value }
          }
        }
      }
    }
  }
`;

const METAFIELDS_SET = /* GraphQL */ `
  mutation MarkGiftsSent($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      userErrors { field message }
    }
  }
`;

/** Orders are only possible during the sale; pad a day either side for
 * timezone edges. Shopify's search reads these as UTC dates. */
function ordersSearch(): string {
  const start = new Date(Date.parse(`${GIFT_DATE_MIN}T00:00:00Z`) - 864e5).toISOString().slice(0, 10);
  const end = new Date(Date.parse(SALE_CLOSES_AT) + 864e5).toISOString().slice(0, 10);
  return `created_at:>=${start} created_at:<=${end} financial_status:paid`;
}

/** A stable UUID-shaped ID per (line, event), passed to Omnisend. */
function eventId(lineId: string, event: string): string {
  const h = createHash("sha256").update(`${lineId}|${event}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function barsFrom(variantTitle: string | null): number | null {
  const m = /(\d+)/.exec(variantTitle ?? "");
  return m ? Number(m[1]) : null;
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

  let after: string | null = null;
  do {
    const page: { orders: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: OrderNode[] } } =
      await adminFetch(ORDERS_QUERY, { query: ordersSearch(), after });
    after = page.orders.pageInfo.hasNextPage ? page.orders.pageInfo.endCursor : null;

    for (const order of page.orders.nodes) {
      const lines = order.lineItems.nodes.filter(
        (l) => l.product?.handle === MISCHIEF_SOCIETY_HANDLE && l.currentQuantity > 0
      );
      if (order.cancelledAt || lines.length === 0) continue;
      result.ordersScanned++;

      const sent = parseSent(order.metafield?.value);
      const handledNow: string[] = [];
      const buyerFirst = order.customer?.firstName?.trim() || "";
      const buyerLast = order.customer?.lastName?.trim() || "";

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
                  note: gift.note,
                  bars_per_month: bars ?? "",
                  order: order.name,
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
                },
              });
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
              { ownerId: order.id, namespace: METAFIELD_NAMESPACE, key: METAFIELD_KEY, type: "json", value },
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
  } while (after);

  return result;
}
