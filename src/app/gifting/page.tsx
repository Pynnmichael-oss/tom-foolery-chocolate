import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/layout/ComingSoonPage";

const BODY =
  "Bulk gifting for your team, your clients, or anyone who deserves a little trouble — details land here soon.";

export const metadata: Metadata = {
  title: "Corporate Gifting",
  description: BODY,
  alternates: { canonical: "/gifting" },
  // Placeholder copy — no reason to send crawlers here until it's real.
  robots: { index: false, follow: true },
};

export default function GiftingPage() {
  return (
    <ComingSoonPage
      preheader="Treat Someone Else"
      headline="Corporate Gifting, Sweetened Up"
      body={BODY}
    />
  );
}
