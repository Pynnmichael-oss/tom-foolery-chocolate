import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getShopPolicies } from "@/lib/shopify/queries";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: `${SITE_NAME}'s return, refund, and exchange policy.`,
  alternates: { canonical: "/returns" },
};

/** Maps to Shopify's `refundPolicy` — content lives in the Shopify admin
 * (Settings → Policies), not this repo — see `getShopPolicies`. 404s
 * instead of rendering a blank page if the merchant hasn't filled this
 * one in yet. */
export default async function ReturnsPolicyPage() {
  const { refundPolicy } = await getShopPolicies();
  if (!refundPolicy) notFound();

  return <PolicyPage policy={refundPolicy} />;
}
