import { parseCsv } from "@/lib/csv";
import type { PressMention, PressType } from "./types";

/**
 * The press page's coverage list lives in one tab of a Google Sheet,
 * published to the web as CSV (File → Share → Publish to web → pick the
 * tab → CSV). Add a row, set Status to Live, and /press follows within
 * the hour, no deploy.
 *
 * Columns are found by header name, not position, so the sheet can be
 * re-ordered or given extra working columns freely:
 *
 *   Status    Live | Draft | Hidden. Only Live rows are shown; anything
 *             else (blank, a typo) stays off the page.
 *   Date      YYYY-MM-DD (or Sheets' own 11/25/2026); newest first
 *   Outlet    the publication, show or award body, as it should read
 *   Headline  the piece's title, or the award's name
 *   URL       link to the piece (http/https)
 *   Type      Article | Gift Guide | Podcast | Video | Award
 *             (blank or unrecognised = Article)
 *   Quote     optional, a short line from the piece to show on the page
 *   Author    optional, the writer or host
 *   Featured  Yes to pin it to the top with its quote
 *
 * The published tab is public, so it must only hold what the page
 * prints. Pitch notes, contacts and follow-ups belong in a different,
 * unpublished sheet.
 */

/** How long a fetched copy of the sheet is reused before asking again. */
export const PRESS_SHEET_REVALIDATE_SECONDS = 60 * 60;

/**
 * The coverage tab's publish-to-web CSV link. Not a secret (the tab is
 * public by design), so it can live here. PRESS_SHEET_CSV_URL overrides
 * it, for pointing a preview at a test sheet or moving sheets without a
 * code change. `gid=0` is the Coverage tab; `single=true` keeps it to that
 * tab alone. If the tab is ever unpublished and republished, Google
 * issues a new link: update it here.
 */
const DEFAULT_PRESS_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTtQFTAxPbJokbmakKSUhsu5Tk96u1paXkg1TEO1lyn4yqJvZi5UM17UQN78rcwcPGGuXwVTVT5uF_j/pub?gid=0&single=true&output=csv";

export function pressSheetUrl(): string {
  return process.env.PRESS_SHEET_CSV_URL || DEFAULT_PRESS_SHEET_CSV_URL;
}

export async function fetchPressSheetCsv(): Promise<string> {
  const url = pressSheetUrl();
  if (!url) throw new Error("No press sheet URL configured");

  const response = await fetch(url, {
    next: { revalidate: PRESS_SHEET_REVALIDATE_SECONDS, tags: ["press"] },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Press sheet fetch failed: HTTP ${response.status}`);

  const text = await response.text();
  // An unpublished or private sheet answers 200 with a Google sign-in
  // page rather than an error.
  if (/^\s*<(!doctype|html)/i.test(text)) {
    throw new Error("Press sheet URL returned a web page, not CSV. Is the tab published to the web?");
  }
  return text;
}

const TYPES: Record<string, PressType> = {
  article: "Article",
  "gift guide": "Gift Guide",
  giftguide: "Gift Guide",
  podcast: "Podcast",
  video: "Video",
  tv: "Video",
  award: "Award",
};

function clean(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/** "2026-10-08" or Sheets' own "10/8/2026" → "2026-10-08", else null. */
function normalizeDate(raw: string): string | null {
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  const parts = iso ? [iso[1], iso[2], iso[3]] : us ? [us[3], us[1], us[2]] : null;
  if (!parts) return null;
  const [y, m, d] = parts.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Rejects 2026-02-31 and friends, which Date would roll into March.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function normalizeUrl(raw: string): string | null {
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}

const REQUIRED_COLUMNS = ["status", "date", "outlet", "headline", "url"];

/**
 * Sheet rows → the coverage to show, featured first, then newest first.
 * A row is left out unless its Status is Live and it has an outlet, a
 * headline, a readable date and a working link, so a half-filled row
 * can't put a broken entry on the page.
 *
 * Throws when a required column is missing: that means a header was
 * renamed or the wrong tab was published, and the caller falls back to
 * the snapshot instead of showing an empty page.
 */
export function mentionsFromCsv(csv: string): PressMention[] {
  const [header, ...rows] = parseCsv(csv);
  if (!header) throw new Error("Press sheet is empty");

  const column = new Map(header.map((title, index) => [clean(title).toLowerCase(), index]));
  const missing = REQUIRED_COLUMNS.filter((name) => !column.has(name));
  if (missing.length > 0) throw new Error(`Press sheet is missing columns: ${missing.join(", ")}`);

  const read = (row: string[], title: string) => clean(row[column.get(title) ?? -1]);
  const mentions: PressMention[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (read(row, "status").toLowerCase() !== "live") continue;

    const outlet = read(row, "outlet");
    const headline = read(row, "headline");
    const date = normalizeDate(read(row, "date"));
    const url = normalizeUrl(read(row, "url"));
    if (!outlet || !headline || !date || !url || seen.has(url)) continue;
    seen.add(url);

    const quote = read(row, "quote").replace(/^["“”]+|["“”]+$/g, "");
    const author = read(row, "author");
    mentions.push({
      date,
      outlet,
      headline,
      url,
      type: TYPES[read(row, "type").toLowerCase()] ?? "Article",
      ...(quote ? { quote } : {}),
      ...(author ? { author } : {}),
      featured: /^(y|yes|true|x|1)$/i.test(read(row, "featured")),
    });
  }

  return mentions.sort(
    (a, b) => Number(b.featured) - Number(a.featured) || b.date.localeCompare(a.date)
  );
}
