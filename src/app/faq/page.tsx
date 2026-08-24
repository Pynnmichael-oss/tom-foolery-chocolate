import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/layout/ComingSoonPage";

const BODY =
  "We're still writing the answers — mostly because we keep getting distracted by chocolate. Frequently asked questions, coming soon.";

export const metadata: Metadata = {
  title: "FAQ",
  description: BODY,
  alternates: { canonical: "/faq" },
  // Placeholder copy — no reason to send crawlers here until it's real.
  robots: { index: false, follow: true },
};

export default function FaqPage() {
  return (
    <ComingSoonPage
      preheader="Good Questions"
      headline="Frequently Asked, Rarely Answered (Yet)"
      body={BODY}
    />
  );
}
