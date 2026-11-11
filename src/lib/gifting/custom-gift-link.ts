"use client";

import type { MouseEvent } from "react";
import { useScrollToGiftingForm } from "@/lib/hooks/useScrollToGiftingForm";
import { HUBSPOT_GIFTING_FORM_URL } from "@/lib/gifting/hubspot";

export { CUSTOM_GIFT_CTA_LABEL } from "@/lib/gifting/hubspot";

/**
 * `href` (+ `onClick` for the on-page fallback) for a "make it custom" CTA.
 * `fallbackHref` is where to go when HubSpot isn't configured:
 * `#custom-gift` on /gifting itself, `/gifting#custom-gift` from anywhere
 * else (the scroll hook no-ops when the anchor isn't on the current page).
 */
export function useCustomGiftLink(fallbackHref: string = "#custom-gift"): {
  href: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
} {
  const scrollToForm = useScrollToGiftingForm();
  if (HUBSPOT_GIFTING_FORM_URL) return { href: HUBSPOT_GIFTING_FORM_URL };
  return { href: fallbackHref, onClick: scrollToForm };
}
