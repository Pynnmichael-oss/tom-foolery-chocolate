import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getShopPolicies } from "@/lib/shopify/queries";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description: `How ${SITE_NAME} ships your order.`,
  alternates: { canonical: "/shipping" },
};

/** Content lives in the Shopify admin (Settings → Policies), not this
 * repo — see `getShopPolicies`. 404s instead of rendering a blank page if
 * the merchant hasn't filled this one in yet. */
export default async function ShippingPolicyPage() {
  const { shippingPolicy } = await getShopPolicies();
  if (!shippingPolicy) notFound();

  return <PolicyPage policy={shippingPolicy} />;
}
