import { isProductionRuntime } from "@/lib/env";

export interface ResolvedFormEmail {
  to: string;
  from: string;
}

interface ResolveFormEmailError {
  errorResponse: Response;
}

interface FormEmailEnvVars {
  to: "CONTACT_TO_EMAIL" | "GIFTING_TO_EMAIL";
  from: "CONTACT_FROM_EMAIL" | "GIFTING_FROM_EMAIL";
}

// Dev-only convenience so `next dev` (and Vercel Preview deploys, which
// also lack a verified sending domain — see isProductionRuntime) keep
// working without CONTACT_*/GIFTING_* env vars configured. Never used
// when isProductionRuntime() is true — see resolveFormEmail below.
// `onboarding@resend.dev` is Resend's own shared sandbox sender, usable
// with any API key before a domain is verified, but only deliverable to
// the Resend account's own registered email — which is why the dev
// recipient below is that same account's inbox, not a real business
// address.
const DEV_FALLBACK_FROM = "Tom Foolery Website (dev) <onboarding@resend.dev>";
const DEV_FALLBACK_TO = "pynnmichael@outlook.com";

/**
 * Resolves the to/from addresses for a form route (`/api/contact`,
 * `/api/gifting`). In a genuine production deploy, both must come from
 * real env vars (see `.env.example`) — a missing one is a configuration
 * problem, surfaced to the submitter as a friendly 503 and logged loudly
 * server-side, never silently redirected to a personal inbox or an
 * unverified sandbox sender. Outside production (local dev, Vercel
 * Preview — see `isProductionRuntime`), falls back to a clearly-labeled
 * dev sender/recipient so the form still works without secrets
 * configured.
 *
 * Callers should check `isResendConfigured()` first (a distinct "no API
 * key at all" problem with its own existing error message) — this only
 * resolves addresses, assuming Resend itself is already configured.
 */
export function resolveFormEmail(
  formName: string,
  envVars: FormEmailEnvVars
): ResolvedFormEmail | ResolveFormEmailError {
  const to = process.env[envVars.to];
  const from = process.env[envVars.from];

  if (to && from) return { to, from };

  if (!isProductionRuntime()) {
    return { to: to || DEV_FALLBACK_TO, from: from || DEV_FALLBACK_FROM };
  }

  const missing: string[] = [];
  if (!to) missing.push(envVars.to);
  if (!from) missing.push(envVars.from);
  console.error(`[${formName}] misconfigured in production — missing ${missing.join(", ")}.`);
  return {
    errorResponse: Response.json(
      { error: "This form isn't set up right now. Please email us directly in the meantime." },
      { status: 503 }
    ),
  };
}
