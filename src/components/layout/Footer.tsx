import { StripeDivider } from "@/components/ui/StripeDivider";
import { StackedSignature } from "@/components/ui/logos";

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "#story", label: "Story" },
  { href: "/faq", label: "FAQ" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/find-us", label: "Where to Find Us" },
  { href: "/gifting", label: "Corporate Gifting" },
];

const SOCIALS = [
  { href: "#", label: "Instagram" },
  { href: "#", label: "TikTok" },
  { href: "#", label: "Newsletter" },
];

export function Footer() {
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
          {FOOTER_LINKS.map((link) => (
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
          {SOCIALS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              className="font-sans text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em] text-tf-white/60 transition-colors hover:text-tf-white"
            >
              {social.label}
            </a>
          ))}
        </div>

        {/* /70 not /40 — WCAG AA (/40 measures 3.39:1, fails at this size) */}
        <p className="font-sans text-[length:var(--fs-preheader)] text-tf-white/70">
          © {new Date().getFullYear()} Tom Foolery Chocolate. Live a little.
        </p>
      </div>
    </footer>
  );
}
