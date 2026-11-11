import { HUBSPOT_PROPERTIES } from "./normalize";
import type { HubSpotCompany } from "./types";

/**
 * "Stores who made a real purchase in the last N days", straight from
 * HubSpot: companies whose `last_order_date` ("Date of most recent paid
 * order. Set by TF Ops Sync.") falls inside the window. Samples never
 * move that date, so a sample-only account can't qualify.
 *
 * Auth is a HubSpot private-app access token (HUBSPOT_ACCESS_TOKEN, scope
 * `crm.objects.companies.read`) — server-only, see .env.example.
 */
const SEARCH_URL = "https://api.hubapi.com/crm/v3/objects/companies/search";

/** How long a HubSpot response is reused before /find-us asks again. */
export const STOCKIST_REVALIDATE_SECONDS = 6 * 60 * 60;

const PAGE_SIZE = 200; // the search API's maximum
const MAX_PAGES = 25; // 5,000 stockists — a runaway-loop guard, not a real limit

export function isHubSpotConfigured(): boolean {
  return Boolean(process.env.HUBSPOT_ACCESS_TOKEN);
}

/** Midnight UTC, `windowDays` ago, as the epoch-ms string HubSpot's
 * search API takes for date properties. Snapped to the day so the request
 * body — which is also Next's cache key for this POST — only changes once
 * a day rather than on every call. */
function windowStart(windowDays: number): string {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return String(todayUtc - windowDays * 24 * 60 * 60 * 1000);
}

interface SearchResponse {
  results?: HubSpotCompany[];
  paging?: { next?: { after?: string } };
}

export async function fetchRecentBuyers(windowDays: number): Promise<HubSpotCompany[]> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN is not set");

  const companies: HubSpotCompany[] = [];
  let after: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await fetch(SEARCH_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              { propertyName: "last_order_date", operator: "GTE", value: windowStart(windowDays) },
            ],
          },
        ],
        properties: HUBSPOT_PROPERTIES,
        sorts: [{ propertyName: "hs_object_id", direction: "ASCENDING" }],
        limit: PAGE_SIZE,
        ...(after ? { after } : {}),
      }),
      next: { revalidate: STOCKIST_REVALIDATE_SECONDS, tags: ["stockists"] },
    });

    if (!response.ok) {
      // Status only — a HubSpot error body can echo request details.
      throw new Error(`HubSpot company search failed: HTTP ${response.status}`);
    }

    const body = (await response.json()) as SearchResponse;
    companies.push(...(body.results ?? []));
    after = body.paging?.next?.after;
    if (!after) break;
  }

  return companies;
}
