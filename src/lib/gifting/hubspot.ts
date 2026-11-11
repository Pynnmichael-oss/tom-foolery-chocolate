/**
 * HubSpot form that custom/branded and event gifting inquiries go to — a
 * HubSpot share link (e.g. https://share.hsforms.com/…) or any page that
 * hosts the form. `NEXT_PUBLIC_` so client CTAs can read it too; it's a
 * public URL, not a secret.
 *
 * Unset → every "custom" CTA falls back to the on-site inquiry form at
 * `/gifting#custom-gift` (GiftingForm, Resend-backed), so nothing links to
 * a dead URL while the HubSpot form is still being set up.
 *
 * Deliberately NOT in the "use client" custom-gift-link.ts: app/gifting/
 * page.tsx (a server component) reads this, and a value imported from a
 * client module arrives there as an always-truthy client reference.
 */
export const HUBSPOT_GIFTING_FORM_URL: string | null =
  process.env.NEXT_PUBLIC_HUBSPOT_GIFTING_FORM_URL?.trim() || null;

/** Label for every "custom gifting" CTA, so the hero, panels and the
 * collection band all say the same thing. */
export const CUSTOM_GIFT_CTA_LABEL = "Start a Custom Order";
