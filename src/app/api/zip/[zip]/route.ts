import { NextResponse } from "next/server";
import { lookupZip } from "@/lib/stockists/zip";

/**
 * GET /api/zip/60614 → { zip, lat, lng } — the centre of a US ZIP code,
 * for /find-us to measure "nearest shop" distances from. Reads a bundled
 * table (src/lib/stockists/zip.ts); no third-party call, nothing logged.
 * 404 for anything that isn't a real 5-digit ZIP.
 */

// A ZIP's centre doesn't change between deploys — let the browser and
// the CDN keep answers for a day.
const CACHE_HEADERS = { "Cache-Control": "public, max-age=86400, s-maxage=86400" };

export async function GET(_request: Request, { params }: { params: Promise<{ zip: string }> }) {
  const { zip } = await params;
  const point = lookupZip(zip);

  if (!point) {
    return NextResponse.json({ error: "Unknown ZIP code" }, { status: 404, headers: CACHE_HEADERS });
  }
  return NextResponse.json({ zip, ...point }, { headers: CACHE_HEADERS });
}
