/**
 * Thin, typed fetch wrapper around the Resend email API — same "no SDK
 * dependency, it's one endpoint and one auth header" call as
 * `lib/shopify/client.ts`, rather than adding the `resend` npm package for
 * a single POST.
 *
 * Requires `RESEND_API_KEY` (server-only — no NEXT_PUBLIC_ prefix, this is
 * never called from the browser). See `.env.example` for the full setup
 * checklist (domain verification, etc.) before this can actually send.
 */

export class ResendApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ResendApiError";
  }
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

interface SendEmailInput {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}

interface ResendErrorBody {
  message?: string;
  name?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new ResendApiError("Resend is not configured — missing RESEND_API_KEY.");
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: input.to,
        from: input.from,
        reply_to: input.replyTo,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
  } catch (cause) {
    throw new ResendApiError("Failed to reach the Resend API.", cause);
  }

  if (!response.ok) {
    let body: ResendErrorBody = {};
    try {
      body = await response.json();
    } catch {
      // Non-JSON error body — fall back to the status text below.
    }
    throw new ResendApiError(
      body.message ?? `Resend returned ${response.status} ${response.statusText}`,
      body
    );
  }
}
