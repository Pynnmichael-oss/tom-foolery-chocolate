import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/layout/ComingSoonPage";

const BODY =
  "Big appetite for chocolate chaos? So do we. This page is still in the kitchen — check back soon for how to stock up.";

export const metadata: Metadata = {
  title: "Wholesale",
  description: BODY,
  alternates: { canonical: "/wholesale" },
  // Placeholder copy — no reason to send crawlers here until it's real.
  robots: { index: false, follow: true },
};

export default function WholesalePage() {
  return (
    <ComingSoonPage
      preheader="For the Bulk Buyers"
      headline="Wholesale Mischief, Coming Soon"
      body={BODY}
    />
  );
}
