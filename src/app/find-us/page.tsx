import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/layout/ComingSoonPage";

const BODY =
  "We're plotting every place you can get your hands on some Tom Foolery. The map's still being drawn — literally.";

export const metadata: Metadata = {
  title: "Where to Find Us",
  description: BODY,
  alternates: { canonical: "/find-us" },
  // Placeholder copy — no reason to send crawlers here until it's real.
  robots: { index: false, follow: true },
};

export default function FindUsPage() {
  return (
    <ComingSoonPage preheader="Where's Tom?" headline="A Map Is On Its Way" body={BODY} />
  );
}
