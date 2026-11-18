/**
 * Minimal Shopify Admin GraphQL client — server-only (the token has write
 * access). Used by the Mischief Society gift-email job to read paid orders
 * and mark gifts as sent. Everything customer-facing still goes through
 * the Storefront API in client.ts.
 *
 * Env:
 *  - SHOPIFY_ADMIN_ACCESS_TOKEN — Admin API token from a custom app
 *    (Settings → Apps → Develop apps) with read_orders + write_orders,
 *    and protected customer data access for order email.
 *  - SHOPIFY_ADMIN_STORE_DOMAIN — optional; the *.myshopify.com domain.
 *    Falls back to NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN.
 */
import { SHOPIFY_API_VERSION } from "./client";

export class ShopifyAdminError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ShopifyAdminError";
  }
}

function adminDomain(): string | undefined {
  return process.env.SHOPIFY_ADMIN_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
}

export function isShopifyAdminConfigured(): boolean {
  return Boolean(adminDomain() && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN);
}

export async function adminFetch<TData>(
  query: string,
  variables?: Record<string, unknown>
): Promise<TData> {
  const domain = adminDomain();
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (!domain || !token) {
    throw new ShopifyAdminError(
      "Shopify Admin API is not configured — set SHOPIFY_ADMIN_ACCESS_TOKEN (and the store domain)."
    );
  }

  let response: Response;
  try {
    response = await fetch(`https://${domain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
  } catch (cause) {
    throw new ShopifyAdminError("Failed to reach the Shopify Admin API.", cause);
  }

  let body: { data?: TData; errors?: Array<{ message: string }> | string };
  try {
    body = await response.json();
  } catch (cause) {
    throw new ShopifyAdminError(`Shopify Admin API returned non-JSON (HTTP ${response.status}).`, cause);
  }

  if (!response.ok || body.errors) {
    const message = Array.isArray(body.errors)
      ? body.errors.map((e) => e.message).join("; ")
      : body.errors ?? response.statusText;
    throw new ShopifyAdminError(`Shopify Admin API error: ${message}`, body.errors);
  }
  if (!body.data) throw new ShopifyAdminError("Shopify Admin API returned no data.");
  return body.data;
}
