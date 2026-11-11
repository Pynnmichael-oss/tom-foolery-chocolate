"use client";

import { GiftingHeroGraphic } from "./GiftingHeroGraphic";
import { useScrollToGiftingForm } from "@/lib/hooks/useScrollToGiftingForm";
import {
  FAIRE_CTA_LABEL,
  FAIRE_WHOLESALE_URL,
  WHOLESALE_FORM_ANCHOR,
  WHOLESALE_FORM_FIRST_FIELD,
} from "@/lib/wholesale/constants";

/**
 * /wholesale hero — the same graphic hero /gifting uses (stripe field,
 * product cutout, Tom peeking), on a juniper ground with wholesale copy.
 * Primary CTA goes off-site to Faire; secondary scrolls to the on-page
 * inquiry form.
 */
export function WholesaleHero() {
  const scrollToForm = useScrollToGiftingForm(WHOLESALE_FORM_ANCHOR, WHOLESALE_FORM_FIRST_FIELD);
  return (
    <GiftingHeroGraphic
      groundColor="var(--tf-juniper)"
      content={{
        preheader: "Wholesale",
        title: "Stock a little mischief.",
        sub: "Small-batch Chicago chocolate with nostalgic flavors and packaging that pops on the counter — an easy yes for your shoppers.",
        primaryCta: { href: FAIRE_WHOLESALE_URL, label: FAIRE_CTA_LABEL, external: true },
        secondaryCta: {
          href: `#${WHOLESALE_FORM_ANCHOR}`,
          label: "Wholesale Inquiry",
          onClick: scrollToForm,
        },
      }}
    />
  );
}
