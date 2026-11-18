import {
  EMAIL_RE,
  createRateLimiter,
  getClientIp,
  isHoneypotTriggered,
} from "@/lib/forms/shared";
import { isOmnisendConfigured, upsertContact } from "@/lib/omnisend/server";
import { OMNISEND_LAUNCH_ALERT_TAG, salePhase } from "@/lib/mischief-society/config";

/**
 * "Email me when doors open" signup on /mischief-society, shown only before
 * the sale opens. Subscribes the email in Omnisend (with a consent record)
 * and tags it for the launch alert. Refused once the sale is open or over,
 * judged by the server's clock — never the client's.
 */
export const dynamic = "force-dynamic";

const checkRateLimit = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

export async function POST(request: Request) {
  let body: { email?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Bot filled the hidden field: fake success, nothing stored.
  if (isHoneypotTriggered(body.website)) return Response.json({ success: true });

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const phase = salePhase();
  if (phase !== "pre") {
    return Response.json(
      {
        error:
          phase === "live"
            ? "Doors are open now, so you can join right away. Refresh the page to see the membership options."
            : "Memberships are closed for this season.",
      },
      { status: 409 }
    );
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(ip || "unknown")) {
    return Response.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  if (!isOmnisendConfigured()) {
    console.error("[mischief-society] OMNISEND_API_KEY is not set — see .env.example.");
    return Response.json(
      { error: "Signups aren't set up yet. Please check back soon." },
      { status: 503 }
    );
  }

  try {
    await upsertContact({
      email,
      tags: [OMNISEND_LAUNCH_ALERT_TAG, "source: mischief-society-page"],
      subscribe: {
        source: "Mischief Society page: email me when doors open",
        ip: ip || undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
    });
    return Response.json({ success: true });
  } catch (error) {
    console.error("[mischief-society] notify signup failed:", error);
    return Response.json(
      { error: "We couldn't sign you up just now. Please try again in a moment." },
      { status: 502 }
    );
  }
}
