/**
 * One-off generator — NOT part of the Next.js app, run by hand:
 *
 *   npm run build-zip-centroids
 *
 * Writes src/data/zip-centroids.json: every US ZIP code → [lat, lng] of
 * its approximate centre, which is what lets /find-us turn a typed ZIP
 * into a point to measure distances from (see src/lib/stockists/zip.ts).
 *
 * Source is the `zipcodes` npm package (a devDependency only — nothing
 * at runtime imports it), which unlike the Census ZCTA files also covers
 * PO-box-only and single-building ZIPs, i.e. anything a visitor might
 * actually type. Coordinates are rounded to 3 decimals (~100 m), far
 * finer than a ZIP's own extent, to keep the file small. ZIPs change
 * slowly; re-run after bumping the package if a new one ever goes missing.
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

interface ZipRecord {
  latitude?: number;
  longitude?: number;
  country?: string;
}

const require = createRequire(import.meta.url);
const { codes } = require("zipcodes") as { codes: Record<string, ZipRecord> };

const table: Record<string, [number, number]> = {};
for (const zip of Object.keys(codes).sort()) {
  const { latitude, longitude, country } = codes[zip];
  if (!/^\d{5}$/.test(zip) || country !== "US") continue;
  if (typeof latitude !== "number" || typeof longitude !== "number") continue;
  if (latitude === 0 && longitude === 0) continue;
  table[zip] = [Math.round(latitude * 1e3) / 1e3, Math.round(longitude * 1e3) / 1e3];
}

const out = resolve(process.cwd(), "src/data/zip-centroids.json");
writeFileSync(out, JSON.stringify(table));
console.log(`Wrote ${Object.keys(table).length} ZIP codes to ${out}`);
