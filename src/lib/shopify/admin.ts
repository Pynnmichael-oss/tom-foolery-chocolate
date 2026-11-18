/**
 * Minimal Shopify Admin GraphQL client — server-only (the token has write
 * access). Used by the Mischief Society gift-email job to read paid orders
 * and mark gifts as sent. Everything customer-facing still goes through
 * the Storefront API in client.ts.
 *
 * Auth, either of:
 *  - SHOPIFY_ADMIN_CLIENT_ID + SHOPIFY_ADMIN_CLIENT_SECRET — an app made
 *    in Shopify's Dev Dashboard and installed on the store (the only kind
 *    Shopify lets you create now). Exchanged for a 24-hour token with the
 *    client credentials grant, cached here until shortly before expiry.
 *  - SHOPIFY_ADMIN_ACCESS_TOKEN — a permanent token from an older
 *    admin-created ("legacy") custom app, if one already exists.
 * Scopes: read_orders + write_orders, plus protected customer data access
 * for customer email and name.
 *
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

function hasClientCredentials(): boolean {
  return Boolean(process.env.SHOPIFY_ADMIN_CLIENT_ID && process.env.SHOPIFY_ADMIN_CLIENT_SECRET);
}

export function isShopifyAdminConfigured(): boolean {
  return Boolean(adminDomain() && (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || hasClientCredentials()));
}

let cachedToken: { value: string; expiresAt: number } | null = null;

/** Static legacy token if set, otherwise a client-credentials token
 * (requested once and reused until a minute before it expires). */
async function adminToken(domain: string): Promise<string> {
  if (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (!hasClientCredentials()) {
    throw new ShopifyAdminError(
      "Shopify Admin API is not configured — set SHOPIFY_ADMIN_CLIENT_ID and SHOPIFY_ADMIN_CLIENT_SECRET."
    );
  }
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.value;

  let response: Response;
  try {
    response = await fetch(`https://${domain}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SHOPIFY_ADMIN_CLIENT_ID!,
        client_secret: process.env.SHOPIFY_ADMIN_CLIENT_SECRET!,
      }),
      cache: "no-store",
    });
  } catch (cause) {
    throw new ShopifyAdminError("Failed to reach Shopify for an Admin API token.", cause);
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ShopifyAdminError(
      `Shopify refused the Admin API token request (HTTP ${response.status}): ${text.slice(0, 200)}`
    );
  }
  const body = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw new ShopifyAdminError("Shopify's token response had no access_token.");
  cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 86_399) * 1000 };
  return cachedToken.value;
}

export async function adminFetch<TData>(
  query: string,
  variables?: Record<string, unknown>
): Promise<TData> {
  const domain = adminDomain();
  if (!domain) {
    throw new ShopifyAdminError("Shopify Admin API is not configured — no store domain set.");
  }
  const token = await adminToken(domain);

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
