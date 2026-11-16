import type { StoreListing } from "./types";

/**
 * The store locator's source of truth is one tab of a Google Sheet —
 * "Stores" in "Tom Foolery Store Locator" — published to the web as CSV
 * (File → Share → Publish to web → Stores → CSV) and read from
 * STOCKIST_SHEET_CSV_URL. Whatever that tab says is what the map shows;
 * edit a cell and the site follows within the hour, no deploy.
 *
 * Nothing here talks to HubSpot. A weekly scheduled task copies new
 * wholesale accounts and their latest order dates from HubSpot into the
 * sheet (and looks up each shop's real storefront address); from there
 * on the sheet wins, including over anything HubSpot says.
 *
 * Columns are found by header name, not position, so the sheet can be
 * re-ordered or given extra columns freely:
 *
 *   Store            shop name as it should appear
 *   Status           Listed | City only | Needs review | Hidden
 *   Street           storefront street — only shown when Status is Listed
 *   City, State, ZIP where the shop is
 *   Website, Instagram, Phone   optional
 *   Last paid order  YYYY-MM-DD; the shop drops off the map `windowDays`
 *                    after this. Blank = always shown (for a shop added
 *                    by hand that should stay regardless of orders).
 *   HubSpot ID       optional; ties the row to its HubSpot company
 *
 * The published tab is public, so it must only ever hold addresses that
 * are fine to print — never a ship-to. Research notes and ship-to
 * addresses live on the sheet's other, unpublished tab.
 */

/** How long a fetched copy of the sheet is reused before asking again. */
export const SHEET_REVALIDATE_SECONDS = 60 * 60;

export function isSheetConfigured(): boolean {
  return Boolean(process.env.STOCKIST_SHEET_CSV_URL);
}

export async function fetchSheetCsv(): Promise<string> {
  const url = process.env.STOCKIST_SHEET_CSV_URL;
  if (!url) throw new Error("STOCKIST_SHEET_CSV_URL is not set");

  const response = await fetch(url, {
    next: { revalidate: SHEET_REVALIDATE_SECONDS, tags: ["stockists"] },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Store sheet fetch failed: HTTP ${response.status}`);

  const text = await response.text();
  // An unpublished or private sheet answers 200 with a Google sign-in
  // page rather than an error.
  if (/^\s*<(!doctype|html)/i.test(text)) {
    throw new Error("Store sheet URL returned a web page, not CSV — is the Stores tab published to the web?");
  }
  return text;
}

/** RFC 4180 CSV → rows of cells (quoted fields, "" escapes, newlines
 * inside quotes). Small enough not to need a dependency. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^﻿/, "");

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const US_STATES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", "district of columbia": "DC",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL",
  indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN",
  mississippi: "MS", missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY",
};
const STATE_CODES = new Set(Object.values(US_STATES));

function clean(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeState(raw: string): string | null {
  if (STATE_CODES.has(raw.toUpperCase())) return raw.toUpperCase();
  return US_STATES[raw.toLowerCase()] ?? null;
}

/** Sheets drops a ZIP's leading zero if the cell is ever typed as a
 * number ("4543" for Damariscotta, ME) — put it back. */
function normalizeZip(raw: string): string | null {
  const digits = raw.split("-")[0].replace(/\D/g, "");
  if (digits.length < 3 || digits.length > 5) return null;
  return digits.padStart(5, "0");
}

function normalizeWebsite(raw: string): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.hostname.includes(".") ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Accepts "@handle", "handle", or a pasted profile URL. */
function normalizeInstagram(raw: string): string | undefined {
  const handle = raw
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?].*$/, "")
    .replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? handle : undefined;
}

/** US numbers only, as "(773) 293-6442"; anything else is dropped rather
 * than printed in whatever shape it was typed. */
function normalizePhone(raw: string): string | undefined {
  const digits = raw.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  if (digits.length !== 10) return undefined;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** "2026-10-08" or Sheets' own "10/8/2026" → UTC midnight, else null. */
function parseDate(raw: string): number | null {
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  const parts = iso ? [iso[1], iso[2], iso[3]] : us ? [us[3], us[1], us[2]] : null;
  if (!parts) return null;
  const time = Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return Number.isNaN(time) ? null : time;
}

/**
 * Sheet rows → the stores to put on the map right now. A row is left
 * out when its Status is Hidden, its last paid order is more than
 * `windowDays` ago, or it's missing a name, city, state or ZIP. An
 * unrecognised or empty Status is treated as Needs review — shown, but
 * without a street address — so a typo can hide an address but never
 * publish one.
 */
export function listingsFromCsv(csv: string, windowDays: number, now = Date.now()): StoreListing[] {
  const [header, ...rows] = parseCsv(csv);
  if (!header) return [];

  const column = new Map(header.map((title, index) => [clean(title).toLowerCase(), index]));
  const read = (row: string[], title: string) => clean(row[column.get(title) ?? -1]);
  const cutoff = now - windowDays * 24 * 60 * 60 * 1000;
  const listings: StoreListing[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const status = read(row, "status").toLowerCase();
    if (status === "hidden") continue;

    const lastOrder = read(row, "last paid order");
    if (lastOrder) {
      const time = parseDate(lastOrder);
      // An unreadable date is treated like an old one: better a missing
      // pin than a shop that stopped ordering staying up forever.
      if (time === null || time < cutoff) continue;
    }

    const name = read(row, "store");
    const city = read(row, "city");
    const state = normalizeState(read(row, "state"));
    const zip = normalizeZip(read(row, "zip"));
    if (!name || !city || !state || !zip) continue;

    const id = read(row, "hubspot id") || `${name}|${zip}`.toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);

    listings.push({
      id,
      name,
      street: status === "listed" ? read(row, "street") || null : null,
      city,
      state,
      zip,
      website: normalizeWebsite(read(row, "website")),
      instagram: normalizeInstagram(read(row, "instagram")),
      phone: normalizePhone(read(row, "phone")),
    });
  }

  return listings;
}
