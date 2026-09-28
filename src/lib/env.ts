/**
 * `NODE_ENV === "production"` alone isn't a safe enough signal: Vercel
 * Preview deployments also build with `NODE_ENV=production` (it's a
 * build-mode flag, not an environment identity), which would make a
 * preview branch's missing/misconfigured credentials look like a hard
 * production failure instead of the graceful degradation you actually
 * want while iterating on a preview. `VERCEL_ENV` (set only when
 * actually running on Vercel — "production", "preview", or
 * "development") is the real environment signal, so this only commits to
 * "production" when VERCEL_ENV agrees, or is absent entirely (a plain
 * `next build`/`next start` outside Vercel — e.g. a self-hosted
 * production deploy — has no VERCEL_ENV at all, and that's still
 * production).
 *
 * Shared across domains that need this distinction: `lib/shopify/*`'s
 * mock-data-on-error fallback, and `lib/forms/*`'s dev-only email
 * fallback. Neither owns this concept, so it lives here instead of
 * inside either one.
 */
export function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production")
  );
}
