import { isShopifyConfigured, shopifyFetch } from "./client";
import type { Announcement, AnnouncementStyle } from "./types";

/**
 * Site announcement banner (Black Friday etc.), managed in Shopify admin →
 * Content → Metaobjects → "Announcement Banner" (type
 * `announcement_banner`, Storefront access PUBLIC_READ, publishable).
 *
 * - Only entries with Status = Active come back from the Storefront API
 *   (the definition has the publishable capability), so Active/Draft is
 *   the on/off switch.
 * - Optional `starts_at` / `ends_at` schedule it; checked at render time,
 *   so with the 5-minute revalidate below a scheduled banner flips on/off
 *   within ~5 minutes of the set time.
 * - If several are live at once, the latest `starts_at` wins (an undated
 *   entry counts as the oldest) — lets a Cyber Monday entry take over from
 *   a still-running Black Friday one without unpublishing it.
 *
 * Never throws: a banner is optional, so any failure (unconfigured store,
 * network error, bad data) just means no banner — it must never take a
 * page down, which is why this doesn't use queries.ts's production
 * throw-on-failure helpers.
 */

const ANNOUNCEMENT_REVALIDATE_SECONDS = 300;

const ANNOUNCEMENTS_QUERY = `#graphql
  query Announcements {
    metaobjects(type: "announcement_banner", first: 20) {
      nodes {
        handle
        updatedAt
        fields { key value }
      }
    }
  }
`;

interface RawAnnouncement {
  handle: string;
  updatedAt: string;
  fields: Array<{ key: string; value: string | null }>;
}

const STYLES: Record<string, AnnouncementStyle> = {
  cinnamon: "cinnamon",
  black: "black",
  turmeric: "turmeric",
  juniper: "juniper",
  rose: "rose",
};

function parseDate(value: string | undefined): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

export async function getActiveAnnouncement(now = Date.now()): Promise<Announcement | null> {
  if (!isShopifyConfigured()) return null;

  try {
    const data = await shopifyFetch<{ metaobjects: { nodes: RawAnnouncement[] } }>({
      query: ANNOUNCEMENTS_QUERY,
      revalidate: ANNOUNCEMENT_REVALIDATE_SECONDS,
      tags: ["announcement"],
    });

    const live = data.metaobjects.nodes
      .map((node) => {
        const f = Object.fromEntries(node.fields.map((field) => [field.key, field.value ?? ""]));
        return { node, f, startsAt: parseDate(f.starts_at), endsAt: parseDate(f.ends_at) };
      })
      .filter(
        ({ f, startsAt, endsAt }) =>
          f.message?.trim() &&
          (startsAt === null || startsAt <= now) &&
          (endsAt === null || endsAt > now)
      )
      .sort((a, b) => (b.startsAt ?? -Infinity) - (a.startsAt ?? -Infinity));

    const winner = live[0];
    if (!winner) return null;

    const { node, f } = winner;
    const href = f.link_url?.trim();
    return {
      id: `${node.handle}:${node.updatedAt}`,
      message: f.message.trim(),
      link: href ? { href, label: f.link_label?.trim() || "Shop now" } : null,
      style: STYLES[f.style?.trim().toLowerCase() ?? ""] ?? "cinnamon",
    };
  } catch (error) {
    console.error("[shopify] getActiveAnnouncement failed — rendering no banner:", error);
    return null;
  }
}
