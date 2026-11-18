import { adminFetch, isShopifyAdminConfigured } from "@/lib/shopify/admin";
import { isProductionRuntime } from "@/lib/env";
import type { CartAttribute } from "@/lib/shopify/types";
import { GIFT_DATE_MIN, MEMBERSHIP_SKUS, MEMBERSHIP_TITLE_PREFIX, SALE_CLOSES_AT } from "./config";
import { readGift } from "./gifts";
import type { ShippingAddress } from "./address";

/**
 * Mischief Society memberships, read from and saved to the Shopify order
 * itself — no separate database. One membership = one order line of the
 * membership product. Each member's own details (shipping address now,
 * monthly picks later) live in an order metafield keyed by the line:
 * mischief_society.member_<line id>, so two members on one gift order
 * never overwrite each other.
 *
 * Outside production with no Admin API credentials, a small in-memory
 * sample stands in (same idea as lib/shopify/mock-data.ts), so the member
 * page can be built and checked locally.
 */

export const METAFIELD_NAMESPACE = "mischief_society";
export const GIFTS_SENT_KEY = "gifts_sent";

export interface MembershipOrderLine {
  id: string;
  currentQuantity: number;
  variantTitle: string | null;
  /** The line's own SKU and title (order data). Deliberately not the
   * line's product, which needs the read_products scope. */
  sku: string | null;
  title: string;
  customAttributes: CartAttribute[];
}

export interface MembershipOrder {
  id: string;
  name: string;
  cancelledAt: string | null;
  email: string | null;
  /** The billing name (aliased from billingAddress). Deliberately not the
   * order's customer record, which needs the read_customers scope; the
   * order's own email and billing address only need read_orders. */
  buyer: { firstName: string | null; lastName: string | null } | null;
  metafield: { value: string } | null;
  lineItems: { nodes: MembershipOrderLine[] };
}

export interface MemberRecord {
  address?: ShippingAddress;
  addressUpdatedAt?: string;
}

export interface Membership {
  orderGid: string;
  lineGid: string;
  orderName: string;
  bars: number | null;
  isGift: boolean;
  /** Recipient's name for a gift, buyer's first name otherwise. */
  memberName: string;
  memberEmail: string | null;
  giftedBy: string | null;
  record: MemberRecord;
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
        buyer: billingAddress { firstName lastName }
        metafield(namespace: "${METAFIELD_NAMESPACE}", key: "${GIFTS_SENT_KEY}") { value }
        lineItems(first: 100) {
          nodes { id currentQuantity variantTitle sku title customAttributes { key value } }
        }
      }
    }
  }
`;

const ORDER_QUERY = /* GraphQL */ `
  query MischiefSocietyOrder($id: ID!, $key: String!) {
    order(id: $id) {
      id
      name
      cancelledAt
      email
      displayFinancialStatus
      buyer: billingAddress { firstName lastName }
      member: metafield(namespace: "${METAFIELD_NAMESPACE}", key: $key) { value }
      lineItems(first: 100) {
        nodes { id currentQuantity variantTitle sku title customAttributes { key value } }
      }
    }
  }
`;

const METAFIELDS_SET = /* GraphQL */ `
  mutation SaveMember($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) { userErrors { field message } }
  }
`;

/** Orders are only possible during the sale; pad a day either side for
 * timezone edges. Shopify's search reads these as UTC dates. */
function ordersSearch(): string {
  const start = new Date(Date.parse(`${GIFT_DATE_MIN}T00:00:00Z`) - 864e5).toISOString().slice(0, 10);
  const end = new Date(Date.parse(SALE_CLOSES_AT) + 864e5).toISOString().slice(0, 10);
  return `created_at:>=${start} created_at:<=${end} financial_status:paid`;
}

function lineNumber(lineGid: string): string {
  return /(\d+)$/.exec(lineGid)?.[1] ?? lineGid;
}

export function memberKey(lineGid: string): string {
  return `member_${lineNumber(lineGid)}`;
}

export function barsFrom(variantTitle: string | null): number | null {
  const m = /(\d+)/.exec(variantTitle ?? "");
  return m ? Number(m[1]) : null;
}

export function isMembershipLine(line: MembershipOrderLine): boolean {
  if (line.currentQuantity <= 0) return false;
  const sku = (line.sku ?? "").toUpperCase();
  return (
    MEMBERSHIP_SKUS.some((s) => sku === s.toUpperCase()) ||
    line.title.trim().toLowerCase().startsWith(MEMBERSHIP_TITLE_PREFIX.toLowerCase())
  );
}

function parseRecord(value: string | undefined | null): MemberRecord {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as MemberRecord) : {};
  } catch {
    return {};
  }
}

function toMembership(
  order: Omit<MembershipOrder, "metafield" | "lineItems">,
  line: MembershipOrderLine,
  record: MemberRecord
): Membership {
  const gift = readGift(line.customAttributes);
  const buyerFirst = order.buyer?.firstName?.trim() || "";
  return {
    orderGid: order.id,
    lineGid: line.id,
    orderName: order.name,
    bars: barsFrom(line.variantTitle),
    isGift: Boolean(gift),
    memberName: gift ? gift.name || "friend" : buyerFirst || "friend",
    memberEmail: gift ? gift.email : order.email,
    giftedBy: gift ? gift.from || buyerFirst || null : null,
    record,
  };
}

/* ------------------------------------------------------------------ */
/* Local sample (no Admin API outside production)                       */
/* ------------------------------------------------------------------ */

function isSampleMode(): boolean {
  return !isShopifyAdminConfigured() && !isProductionRuntime();
}

const SAMPLE_ORDER: MembershipOrder = {
  id: "gid://shopify/Order/1000",
  name: "#SAMPLE",
  cancelledAt: null,
  email: "buyer@example.com",
  buyer: { firstName: "Garrett", lastName: "Sample" },
  metafield: null,
  lineItems: {
    nodes: [
      {
        id: "gid://shopify/LineItem/2001",
        currentQuantity: 1,
        variantTitle: "6 Bars",
        sku: "COTM-6-6",
        title: "The Mischief Society: Chocolate of the Month Club",
        customAttributes: [],
      },
      {
        id: "gid://shopify/LineItem/2002",
        currentQuantity: 1,
        variantTitle: "3 Bars",
        sku: "COTM-3-6",
        title: "The Mischief Society: Chocolate of the Month Club",
        customAttributes: [
          { key: "Gift for", value: "Linda Park" },
          { key: "Recipient email", value: "linda@example.com" },
          { key: "Send gift email on", value: "2026-11-18" },
          { key: "From", value: "Garrett" },
        ],
      },
    ],
  },
};

const sampleRecords: Map<string, MemberRecord> =
  ((globalThis as Record<string, unknown>).__mischiefSampleRecords as Map<string, MemberRecord>) ??
  ((globalThis as Record<string, unknown>).__mischiefSampleRecords = new Map<string, MemberRecord>());

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

/** Every paid order from the sale window (all pages). Used by the daily
 * gift job and the "email me my member link" lookup. */
export async function fetchMembershipOrders(): Promise<MembershipOrder[]> {
  if (isSampleMode()) return [SAMPLE_ORDER];
  const orders: MembershipOrder[] = [];
  let after: string | null = null;
  do {
    const page: {
      orders: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: MembershipOrder[] };
    } = await adminFetch(ORDERS_QUERY, { query: ordersSearch(), after });
    orders.push(...page.orders.nodes);
    after = page.orders.pageInfo.hasNextPage ? page.orders.pageInfo.endCursor : null;
  } while (after);
  return orders;
}

/** One membership by order + line, or null if it doesn't exist, isn't a
 * membership line, or the order was cancelled/refunded away. */
export async function getMembership(orderGid: string, lineGid: string): Promise<Membership | null> {
  if (isSampleMode()) {
    if (orderGid !== SAMPLE_ORDER.id) return null;
    const line = SAMPLE_ORDER.lineItems.nodes.find((l) => l.id === lineGid);
    return line ? toMembership(SAMPLE_ORDER, line, sampleRecords.get(lineGid) ?? {}) : null;
  }
  const data = await adminFetch<{
    order:
      | (Omit<MembershipOrder, "metafield"> & {
          displayFinancialStatus: string | null;
          member: { value: string } | null;
        })
      | null;
  }>(ORDER_QUERY, { id: orderGid, key: memberKey(lineGid) });
  const order = data.order;
  if (!order || order.cancelledAt) return null;
  const line = order.lineItems.nodes.find((l) => l.id === lineGid);
  if (!line || !isMembershipLine(line)) return null;
  return toMembership(order, line, parseRecord(order.member?.value));
}

/** Saves the member's shipping address, keeping anything else already in
 * their record (e.g. monthly picks, later). */
export async function saveMemberAddress(membership: Membership, address: ShippingAddress): Promise<void> {
  const record: MemberRecord = {
    ...membership.record,
    address,
    addressUpdatedAt: new Date().toISOString(),
  };
  if (isSampleMode()) {
    sampleRecords.set(membership.lineGid, record);
    return;
  }
  const res = await adminFetch<{ metafieldsSet: { userErrors: Array<{ message: string }> } }>(
    METAFIELDS_SET,
    {
      metafields: [
        {
          ownerId: membership.orderGid,
          namespace: METAFIELD_NAMESPACE,
          key: memberKey(membership.lineGid),
          type: "json",
          value: JSON.stringify(record),
        },
      ],
    }
  );
  if (res.metafieldsSet.userErrors.length) {
    throw new Error(res.metafieldsSet.userErrors.map((e) => e.message).join("; "));
  }
}

/** Memberships that belong to this email: gifts addressed to it (only once
 * their gift date has arrived, so a surprise is never spoiled) and "for
 * me" memberships bought with it. */
export async function findMembershipsByEmail(email: string, today: string): Promise<Membership[]> {
  const target = email.trim().toLowerCase();
  const found: Membership[] = [];
  for (const order of await fetchMembershipOrders()) {
    if (order.cancelledAt) continue;
    for (const line of order.lineItems.nodes) {
      if (!isMembershipLine(line)) continue;
      const gift = readGift(line.customAttributes);
      const matches = gift
        ? gift.email.toLowerCase() === target && Boolean(gift.sendDate) && gift.sendDate <= today
        : (order.email ?? "").toLowerCase() === target;
      if (matches) found.push(toMembership(order, line, {}));
    }
  }
  return found;
}
