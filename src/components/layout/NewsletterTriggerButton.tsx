"use client";

// Set once a form in the Omnisend dashboard is configured for "Custom
// Trigger" display mode (Behavior Settings → Display) — its form ID goes
// here. See .env.example.
const FORM_ID = process.env.NEXT_PUBLIC_OMNISEND_NEWSLETTER_FORM_ID;

declare global {
  interface Window {
    omnisend?: unknown[][];
  }
}

/**
 * Opens Omnisend's hosted newsletter signup form via its documented
 * custom-trigger API: `omnisend.push(["openForm", formId])` (see
 * https://support.omnisend.com/en/articles/10002471-set-up-custom-triggers-for-popup-flyout-forms).
 * Requires both `OmnisendSnippet` already loaded (root layout) and a form
 * in the dashboard explicitly set to "Custom Trigger" — Omnisend's other
 * display modes (time delay, exit intent, etc.) don't respond to this
 * call at all.
 *
 * Renders nothing when `NEXT_PUBLIC_OMNISEND_NEWSLETTER_FORM_ID` is
 * unset, rather than a "Newsletter" link with no form configured to
 * open — see Footer.tsx's own note on why a dead link is worse than no
 * link.
 */
export function NewsletterTriggerButton({ className }: { className?: string }) {
  if (!FORM_ID) return null;

  return (
    <button
      type="button"
      onClick={() => window.omnisend?.push(["openForm", FORM_ID])}
      className={className}
    >
      Newsletter
    </button>
  );
}
