/**
 * Refreshes the committed stockist snapshot — NOT part of the Next.js
 * app, run by hand:
 *
 *   npm run sync-stockists                       # reads the published sheet
 *   npm run sync-stockists -- --input stores.csv # or a downloaded CSV of it
 *
 * Writes src/data/stockists.json, the list /find-us falls back to when
 * the sheet can't be read (see
 * getStockists() in src/lib/stockists/index.ts). It runs the exact same
 * read → filter → geocode pipeline the live page does.
 *
 * `--input` takes the "Stores" tab saved as CSV (File → Download →
 * Comma-separated values) — for refreshing the snapshot from somewhere
 * the published link can't be reached.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { locateListings, STOCKIST_WINDOW_DAYS } from "../src/lib/stockists";
import { fetchSheetCsv, listingsFromCsv, parseCsv } from "../src/lib/stockists/sheet";
import type { Stockist, StockistSnapshot } from "../src/lib/stockists/types";

const SNAPSHOT_PATH = resolve(process.cwd(), "src/data/stockists.json");

// Same minimal .env.local loader as scripts/check-selling-plans.ts —
// this runs outside Next.js, which would otherwise load it for us.
function loadEnvLocal(): void {
  let contents: string;
  try {
    contents = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  } catch {
    return;
  }
  for (const line of contents.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || line.trimStart().startsWith("#")) continue;
    const [, key, raw] = match;
    if (process.env[key] === undefined) process.env[key] = raw.replace(/^(['"])(.*)\1$/, "$2");
  }
}

async function main(): Promise<void> {
  loadEnvLocal();

  const inputFlag = process.argv.indexOf("--input");
  const inputPath = inputFlag === -1 ? undefined : process.argv[inputFlag + 1];
  if (inputFlag !== -1 && !inputPath) throw new Error("--input needs a file path");

  const csv = inputPath ? readFileSync(resolve(process.cwd(), inputPath), "utf8") : await fetchSheetCsv();
  const listings = listingsFromCsv(csv, STOCKIST_WINDOW_DAYS);

  let previous: Stockist[] = [];
  try {
    previous = (JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as StockistSnapshot).stockists;
  } catch {
    // First run — nothing to reuse coordinates from.
  }

  const stockists = await locateListings(listings, previous);
  const snapshot: StockistSnapshot = {
    generatedAt: new Date().toISOString().slice(0, 10),
    windowDays: STOCKIST_WINDOW_DAYS,
    stockists,
  };
  writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);

  const sheetRows = parseCsv(csv).length - 1;
  const withStreet = stockists.filter((s) => s.street);
  console.log(
    `${sheetRows} rows in the sheet → ${stockists.length} on the map ` +
      `(${withStreet.length} with a street address, ${stockists.length - withStreet.length} city-only).`
  );
  console.log(`${sheetRows - stockists.length} left out: hidden, past the ${STOCKIST_WINDOW_DAYS}-day window, or incomplete.`);

  const missed = withStreet.filter((s) => !s.precise);
  if (missed.length) {
    console.log(`\nStreet shown but pinned at ZIP centre — the geocoder had no match (${missed.length}):`);
    for (const s of missed) console.log(`  - ${s.name}: ${s.street}, ${s.city}, ${s.state} ${s.zip}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
