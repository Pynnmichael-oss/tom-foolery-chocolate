/**
 * One-off audit script — NOT part of the Next.js app, run by hand:
 *
 *   npm run check-selling-plans
 *
 * Queries every product in the catalog via the Storefront API (paginating
 * past the single-request cap, so this genuinely covers the whole
 * catalog, not just the first page) and prints which ones have
 * `requiresSellingPlan: true` — Shopify's "this product can only be
 * bought on a subscription" flag — so it's easy to see at a glance which
 * products are subscription-only before they show up unexpectedly in
 * ProductDetail.tsx's purchase-options UI.
 *
 * Read-only: this only ever sends `products(...)` queries, never a
 * mutation, so it's safe to run against production data.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// This script runs outside Next.js, which normally loads .env.local
// automatically — minimal manual loader here instead of a `dotenv`
// dependency, just enough for this repo's actual .env.local shape
// (simple KEY=VALUE lines, no multi-line values, no `export` prefixes).
// Real environment variables (if already set some other way) win over
// anything read from the file.
function loadEnvLocal(): void {
  const path = resolve(process.cwd(), ".env.local");
  let contents: string;
  try {
    contents = readFileSync(path, "utf8");
  } catch {
    return; // No .env.local — fine, maybe the vars are set another way.
  }
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_PUBLIC_TOKEN;
// Keep in sync with src/lib/shopify/client.ts's SHOPIFY_API_VERSION —
// this script talks to the same Storefront API directly rather than
// importing that module, since everything else in src/lib/shopify/ is
// written for Next's server runtime (env var access patterns, Next's own
// fetch cache options), not a standalone script.
const API_VERSION = "2026-07";

if (!DOMAIN || !TOKEN) {
  console.error(
    "Missing NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN / NEXT_PUBLIC_SHOPIFY_STOREFRONT_PUBLIC_TOKEN " +
      "— set them in .env.local (see .env.example) before running this script."
  );
  process.exit(1);
}

const QUERY = `#graphql
  query ProductsSellingPlanAudit($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        handle
        title
        requiresSellingPlan
      }
    }
  }
`;

interface ProductNode {
  handle: string;
  title: string;
  requiresSellingPlan: boolean;
}

interface GraphQLError {
  message: string;
}

async function fetchPage(after: string | null): Promise<{
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  nodes: ProductNode[];
}> {
  const response = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN as string,
    },
    body: JSON.stringify({ query: QUERY, variables: { first: 100, after } }),
  });

  if (!response.ok) {
    throw new Error(`Shopify Storefront API returned ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as {
    data?: { products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: ProductNode[] } };
    errors?: GraphQLError[];
  };

  if (body.errors?.length) {
    throw new Error(`Shopify Storefront API errors: ${body.errors.map((e) => e.message).join("; ")}`);
  }
  if (!body.data) {
    throw new Error("Shopify Storefront API returned no data.");
  }

  return body.data.products;
}

async function main(): Promise<void> {
  const all: ProductNode[] = [];
  let after: string | null = null;

  do {
    const page = await fetchPage(after);
    all.push(...page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);

  const subscriptionOnly = all.filter((p) => p.requiresSellingPlan);

  console.log(`Checked ${all.length} product${all.length === 1 ? "" : "s"}.\n`);

  if (subscriptionOnly.length === 0) {
    console.log("None require a selling plan (subscription-only).");
    return;
  }

  console.log(
    `${subscriptionOnly.length} product${subscriptionOnly.length === 1 ? "" : "s"} require a selling plan (subscription-only):\n`
  );
  for (const product of subscriptionOnly) {
    console.log(`  - ${product.title}  (/shop/${product.handle})`);
  }
}

main().catch((error: unknown) => {
  console.error("check-selling-plans failed:", error);
  process.exit(1);
});
