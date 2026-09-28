import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getShopPolicies } from "@/lib/shopify/queries";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms that govern your use of ${SITE_NAME}.`,
  alternates: { canonical: "/terms" },
};

/** Maps to Shopify's `termsOfService` — content lives in the Shopify
 * admin (Settings → Policies), not this repo — see `getShopPolicies`.
 * 404s instead of rendering a blank page if the merchant hasn't filled
 * this one in yet. */
export default async function TermsPage() {
  const { termsOfService } = await getShopPolicies();
  if (!termsOfService) notFound();

  return <PolicyPage policy={termsOfService} />;
}
