import {
  EMAIL_RE,
  createRateLimiter,
  getClientIp,
  isHoneypotTriggered,
} from "@/lib/forms/shared";
import { isOmnisendConfigured, sendCustomEvent } from "@/lib/omnisend/server";
import { OMNISEND_EVENTS, societyToday } from "@/lib/mischief-society/config";
import { isMemberLinkConfigured, memberUrl } from "@/lib/mischief-society/member-links";
import { findMembershipsByEmail } from "@/lib/mischief-society/members";

/**
 * "Email me my member link" (welcome page). Looks up memberships for the
 * email and sends each one's private link through Omnisend. The reply is
 * the same whether or not anything was found, so the form can't be used
 * to check who's a member. Gifts only count once their gift date has
 * arrived, so this can't spoil a surprise.
 */
export const dynamic = "force-dynamic";

const checkRateLimit = createRateLimiter({ max: 3, windowMs: 10 * 60 * 1000 });

const SENT = {
  success: true,
  message: "If that email has a membership, its link is on the way. Check your inbox (and spam folder).",
};

export async function POST(request: Request) {
  let body: { email?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (isHoneypotTriggered(body.website)) return Response.json(SENT);

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(ip || "unknown")) {
    return Response.json({ error: "Too many requests. Please try again in a few minutes." }, { status: 429 });
  }

  if (!isOmnisendConfigured() || !isMemberLinkConfigured()) {
    console.error("[mischief-society] member links need OMNISEND_API_KEY and MEMBER_LINK_SECRET/CRON_SECRET.");
    return Response.json(
      { error: "This isn't set up yet. Reply to any Society email and we'll send your link." },
      { status: 503 }
    );
  }

  try {
    const memberships = await findMembershipsByEmail(email, societyToday());
    // Links open on the site that was asked (a Vercel preview while
    // testing, production otherwise). memberUrl only trusts known hosts.
    const origin = new URL(request.url).origin;
    for (const m of memberships.slice(0, 10)) {
      await sendCustomEvent({
        name: OMNISEND_EVENTS.memberLink,
        email,
        properties: {
          first_name: m.memberName.split(/\s+/)[0] || "friend",
          bars_per_month: m.bars ?? "",
          member_link: memberUrl(m.orderGid, m.lineGid, origin),
          order: m.orderName,
        },
      });
    }
    return Response.json(SENT);
  } catch (error) {
    console.error("[mischief-society] member link lookup failed:", error);
    return Response.json(
      { error: "We couldn't look that up just now. Please try again in a moment." },
      { status: 502 }
    );
  }
}
