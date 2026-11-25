import type { Metadata } from "next";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import Link from "next/link";
import { ContactForm } from "@/components/sections/ContactForm";

const BODY = "Questions, wholesale inquiries, or just want to talk chocolate? Send us a note.";

export const metadata: Metadata = {
  title: "Contact",
  description: BODY,
  alternates: { canonical: "/contact" },
};

/**
 * First "real" (non-`ComingSoonPage`) footer-nav route — plain MAIN
 * treatment (white/black, inherited `bg-bg`/`text-fg`), no GSAP, same
 * "static and light, on purpose" call `ComingSoonPage` documents for the
 * other footer utility pages. `ContactForm` does the actual work; this
 * file is just the page shell + copy.
 */
export default function ContactPage() {
  return (
    <main id="main-content" className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-fluid-lg px-fluid-md py-fluid-2xl">
      <div className="flex flex-col items-center gap-fluid-sm text-center">
        <Preheader>Get In Touch</Preheader>
        <Headline as="h1" size="md">
          Contact Us
        </Headline>
        <BodyText className="max-w-md text-fg/80">{BODY}</BodyText>
      </div>

      <ContactForm />

      {/* Journalists often land here first; point them at the press kit. */}
      <p className="text-center font-sans text-sm text-fg/80">
        Press or media?{" "}
        <Link href="/press" className="underline underline-offset-2 hover:text-tf-cinnamon-strong">
          See our press kit
        </Link>{" "}
        for facts, photos and logos.
      </p>
    </main>
  );
}
