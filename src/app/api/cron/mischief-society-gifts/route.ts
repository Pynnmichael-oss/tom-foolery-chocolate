import { isOmnisendConfigured } from "@/lib/omnisend/server";
import { isShopifyAdminConfigured } from "@/lib/shopify/admin";
import { runGiftEmails } from "@/lib/mischief-society/gift-emails";
import { societyToday } from "@/lib/mischief-society/config";

/**
 * Daily Mischief Society job — sends each gift email on its date and adds
 * members to the Omnisend list. Scheduled in vercel.json; see
 * lib/mischief-society/gift-emails.ts for what it does.
 *
 * Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`.
 * `?dry=1` reports what would be sent without sending or recording
 * anything — useful for checking an order before the real run.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET is not set." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const missing = [
    !isShopifyAdminConfigured() && "SHOPIFY_ADMIN_ACCESS_TOKEN",
    !isOmnisendConfigured() && "OMNISEND_API_KEY",
  ].filter(Boolean);
  if (missing.length) {
    return Response.json({ error: `Not configured: ${missing.join(", ")}.` }, { status: 503 });
  }

  const dryRun = new URL(request.url).searchParams.get("dry") === "1";

  try {
    const result = await runGiftEmails({ today: societyToday(), dryRun });
    if (result.failures.length) {
      console.error("[mischief-society] gift run had failures:", JSON.stringify(result.failures));
    }
    return Response.json(result, { status: result.failures.length ? 207 : 200 });
  } catch (error) {
    console.error("[mischief-society] gift run failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Gift run failed." },
      { status: 500 }
    );
  }
}
