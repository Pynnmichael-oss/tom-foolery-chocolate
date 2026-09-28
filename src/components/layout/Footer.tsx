import { StripeDivider } from "@/components/ui/StripeDivider";
import { StackedSignature } from "@/components/ui/logos";
import { SOCIAL_LINKS } from "@/lib/social-links";
import { NewsletterTriggerButton } from "@/components/layout/NewsletterTriggerButton";

// Flip to true once FAQ, Wholesale, and Where to Find Us have real
// content — the pages themselves stay live either way (direct links,
// e.g. from the nav or a search result, still work); this only controls
// whether the footer nav points at them.
const SHOW_COMING_SOON = false;

const FOOTER_LINKS: Array<{ href: string; label: string; comingSoon?: boolean }> = [
  { href: "/", label: "Home" },
  { href: "/story", label: "Story" },
  { href: "/faq", label: "FAQ", comingSoon: true },
  { href: "/wholesale", label: "Wholesale", comingSoon: true },
  { href: "/find-us", label: "Where to Find Us", comingSoon: true },
  { href: "/gifting", label: "Corporate Gifting" },
  { href: "/contact", label: "Contact" },
];

// See src/app/{privacy,returns,shipping,terms}/page.tsx — each 404s on
// its own if the merchant hasn't filled in that policy in the Shopify
// admin yet, so these are always linked (not conditional on content
// existing, unlike FOOTER_LINKS' coming-soon pages above).
const POLICY_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/returns", label: "Refund Policy" },
  { href: "/shipping", label: "Shipping Policy" },
  { href: "/terms", label: "Terms of Service" },
];

const SOCIAL_LINK_CLASS =
  "font-sans text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em] text-tf-white/60 transition-colors hover:text-tf-white";

export function Footer() {
  const visibleFooterLinks = FOOTER_LINKS.filter((link) => SHOW_COMING_SOON || !link.comingSoon);

  return (
    // bg-black (pure #000000), not bg-tf-black (#25382A) — brand-requested
    // swap for this section. #25382A already carries some luminance of its
    // own (relative luminance ≈0.034 vs pure black's 0), so this change
    // only *increases* contrast for every white/accent text and icon
    // already in the footer (measured: white/60 ~7.4:1, white/70 ~9.9:1,
    // white/90 higher still, comfortably above the 4.5:1 AA floor for
    // normal-size text) — no new contrast issues, no other class changes
    // needed.
    <footer id="shop" className="bg-black text-tf-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-fluid-lg px-fluid-md py-fluid-2xl text-center">
        <StackedSignature tone="negative" height={120} title="Tom Foolery Chocolate" />
      </div>

      <StripeDivider />

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-fluid-lg px-fluid-md py-fluid-xl text-center">
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-fluid-lg"
        >
          {visibleFooterLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-sans text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em] text-tf-white/80 transition-colors hover:text-tf-turmeric"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-center gap-fluid-md">
          {SOCIAL_LINKS.filter((social) => social.href).map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className={SOCIAL_LINK_CLASS}
            >
              {social.label}
            </a>
          ))}
          <NewsletterTriggerButton className={SOCIAL_LINK_CLASS} />
        </div>

        <nav
          aria-label="Policies"
          className="flex flex-wrap items-center justify-center gap-fluid-md"
        >
          {POLICY_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              // /50 not /60 — one step quieter than the main nav/socials
              // above (legal boilerplate, not primary navigation), still
              // clears WCAG AA (/50 measures 4.6:1 at this size).
              className="font-sans text-xs uppercase tracking-[0.075em] text-tf-white/50 transition-colors hover:text-tf-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* /70 not /40 — WCAG AA (/40 measures 3.39:1, fails at this size) */}
        <p className="font-sans text-[length:var(--fs-preheader)] text-tf-white/70">
          © {new Date().getFullYear()} Tom Foolery Chocolate. Live a little.
        </p>
      </div>
    </footer>
  );
}
