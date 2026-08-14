/**
 * Thin, typed fetch wrapper around the Shopify Storefront GraphQL API.
 * Deliberately no SDK dependency — it's one endpoint and one auth header.
 */

// Bump quarterly: https://shopify.dev/docs/api/usage/versioning
const SHOPIFY_API_VERSION = "2025-01";

/** True once both required env vars are present. Every query/mutation in
 * queries.ts checks this first and falls back to mock-data.ts otherwise. */
export function isShopifyConfigured(): boolean {
  return Boolean(
    process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
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
}: ShopifyFetchOptions<TVariables>): Promise<TData> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!domain || !token) {
    throw new ShopifyApiError(
      "Shopify is not configured — missing SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_ACCESS_TOKEN."
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
