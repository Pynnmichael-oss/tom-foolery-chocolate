/**
 * Refreshes the committed stockist snapshot — NOT part of the Next.js
 * app, run by hand:
 *
 *   npm run sync-stockists                    # pulls from HubSpot
 *   npm run sync-stockists -- --input a.json  # from a saved export
 *
 * Writes src/data/stockists.json, the list /find-us falls back to when
 * HUBSPOT_ACCESS_TOKEN isn't set or HubSpot is unreachable (see
 * getStockists() in src/lib/stockists/index.ts). It runs the exact same
 * filter → clean-up → geocode pipeline the live page does.
 *
 * `--input` takes a JSON array of `{ id, properties }` company records
 * (the shape HubSpot's CRM API returns) — for refreshing the snapshot
 * from an export when there's no API token to hand. The 90-day window is
 * NOT re-applied to an input file; it's assumed to already be the right
 * set of companies.
 *
 * Read-only against HubSpot: one company search, nothing is written back.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildStockists, STOCKIST_WINDOW_DAYS } from "../src/lib/stockists";
import { fetchRecentBuyers } from "../src/lib/stockists/hubspot";
import { normalizeCompany } from "../src/lib/stockists/normalize";
import type { HubSpotCompany, Stockist, StockistSnapshot } from "../src/lib/stockists/types";

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

  const companies: HubSpotCompany[] = inputPath
    ? JSON.parse(readFileSync(resolve(process.cwd(), inputPath), "utf8"))
    : await fetchRecentBuyers(STOCKIST_WINDOW_DAYS);

  let previous: Stockist[] = [];
  try {
    previous = (JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as StockistSnapshot).stockists;
  } catch {
    // First run — nothing to reuse coordinates from.
  }

  const stockists = await buildStockists(companies, previous);
  const snapshot: StockistSnapshot = {
    generatedAt: new Date().toISOString().slice(0, 10),
    windowDays: STOCKIST_WINDOW_DAYS,
    stockists,
  };
  writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);

  const listed = new Set(stockists.map((s) => s.id));
  const skipped = companies.filter((c) => !listed.has(c.id));
  const approximate = stockists.filter((s) => !s.precise);

  console.log(`${companies.length} companies in window → ${stockists.length} stockists written.`);
  if (skipped.length) {
    console.log(`\nNot listed (${skipped.length}):`);
    for (const c of skipped) {
      const why = normalizeCompany(c) ? "no coordinates for its ZIP" : "filtered out (see normalize.ts)";
      console.log(`  - ${c.properties.name ?? c.id}: ${why}`);
    }
  }
  if (approximate.length) {
    console.log(`\nPinned at ZIP centre, not street address (${approximate.length}):`);
    for (const s of approximate) {
      console.log(`  - ${s.name} (${s.city}, ${s.state})${s.street ? " — geocoder had no match" : " — city-only listing"}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
