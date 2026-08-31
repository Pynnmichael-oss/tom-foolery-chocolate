/**
 * Thin, typed fetch wrapper around the Shopify Storefront GraphQL API.
 * Deliberately no SDK dependency — it's one endpoint and one auth header.
 *
 * Two tokens, from the Headless sales channel:
 *  - NEXT_PUBLIC_SHOPIFY_STOREFRONT_PUBLIC_TOKEN — safe to expose to the
 *    browser (it's what "public" means here); used for ordinary reads
 *    (products, collections, cart).
 *  - SHOPIFY_STOREFRONT_PRIVATE_TOKEN — server-only, no NEXT_PUBLIC_
 *    prefix so Next never inlines it into a client bundle; used for
 *    privileged mutations (customerCreate). Pass `server: true` to get it.
 */

// Bump quarterly: https://shopify.dev/docs/api/usage/versioning
const SHOPIFY_API_VERSION = "2026-07";

/** True once the store domain + public token are present. Every
 * query/mutation in queries.ts checks this first and falls back to
 * mock-data.ts otherwise. (Doesn't imply SHOPIFY_STOREFRONT_PRIVATE_TOKEN
 * is set — a `server: true` call still checks for that separately.) */
export function isShopifyConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN &&
      process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_PUBLIC_TOKEN
  );
}

export class ShopifyApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ShopifyApiError";
  }
}

interface ShopifyFetchOptions<TVariables> {
  query: string;
  variables?: TVariables;
  /** Standard fetch cache mode. Defaults to Next's static/ISR caching. */
  cache?: RequestCache;
  /** Next.js ISR revalidate window, seconds. Ignored when `cache` is set. */
  revalidate?: number | false;
  /** Next.js cache tags, for on-demand revalidation. */
  tags?: string[];
  /** Use SHOPIFY_STOREFRONT_PRIVATE_TOKEN instead of the public token —
   * for privileged mutations like customerCreate. Everything in this app
   * runs server-side already (RSC / Server Actions), so this only picks
   * the token, not where the request executes. Defaults to false. */
  server?: boolean;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: Array<{ message: string }>;
}

export async function shopifyFetch<TData, TVariables = Record<string, unknown>>({
  query,
  variables,
  cache,
  revalidate = 3600,
  tags,
  server = false,
}: ShopifyFetchOptions<TVariables>): Promise<TData> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = server
    ? process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN
    : process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_PUBLIC_TOKEN;

  if (!domain) {
    throw new ShopifyApiError(
      "Shopify is not configured — missing NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN."
    );
  }
  if (!token) {
    throw new ShopifyApiError(
      server
        ? "Shopify is not configured — missing SHOPIFY_STOREFRONT_PRIVATE_TOKEN."
        : "Shopify is not configured — missing NEXT_PUBLIC_SHOPIFY_STOREFRONT_PUBLIC_TOKEN."
    );
  }

  const endpoint = `https://${domain}/api/${SHOPIFY_API_VERSION}/graphql.json`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      ...(cache ? { cache } : { next: { revalidate, tags } }),
    });
  } catch (cause) {
    throw new ShopifyApiError("Failed to reach the Shopify Storefront API.", cause);
  }

  let body: GraphQLResponse<TData>;
  try {
    body = await response.json();
  } catch (cause) {
    throw new ShopifyApiError("Shopify returned a non-JSON response.", cause);
  }

  if (!response.ok || body.errors?.length) {
    throw new ShopifyApiError(
      body.errors?.map((e) => e.message).join("; ") ?? response.statusText,
      body.errors
    );
  }

  if (!body.data) {
    throw new ShopifyApiError("Shopify Storefront API returned no data.");
  }

  return body.data;
}
