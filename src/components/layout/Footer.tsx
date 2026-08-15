import { StripeDivider } from "@/components/ui/StripeDivider";
import { StackedSignature } from "@/components/ui/logos";

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "#story", label: "Story" },
];

const SOCIALS = [
  { href: "#", label: "Instagram" },
  { href: "#", label: "TikTok" },
  { href: "#", label: "Newsletter" },
];

export function Footer() {
  return (
    <footer id="shop" className="bg-tf-black text-tf-white">
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
