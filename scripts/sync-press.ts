/**
 * Refreshes the committed press snapshot. NOT part of the Next.js app,
 * run by hand:
 *
 *   npm run sync-press                         # reads the published sheet
 *   npm run sync-press -- --input coverage.csv # or a downloaded CSV of it
 *
 * Writes src/data/press.json, the coverage /press falls back to when the
 * press sheet can't be read (see getPressMentions() in
 * src/lib/press/index.ts), using the same parsing and filtering rules
 * as the live page.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv } from "../src/lib/csv";
import { fetchPressSheetCsv, mentionsFromCsv } from "../src/lib/press/sheet";
import type { PressSnapshot } from "../src/lib/press/types";

const SNAPSHOT_PATH = resolve(process.cwd(), "src/data/press.json");

// Same minimal .env.local loader as scripts/sync-stockists.ts; this runs
// outside Next.js, which would otherwise load it for us.
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

  const csv = inputPath ? readFileSync(resolve(process.cwd(), inputPath), "utf8") : await fetchPressSheetCsv();
  const mentions = mentionsFromCsv(csv);
  const snapshot: PressSnapshot = { updatedAt: new Date().toISOString().slice(0, 10), mentions };
  writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);

  const sheetRows = parseCsv(csv).length - 1;
  console.log(`${sheetRows} rows in the sheet → ${mentions.length} on the page.`);
  console.log(`${sheetRows - mentions.length} left out: not Live, or missing an outlet, headline, date or link.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
