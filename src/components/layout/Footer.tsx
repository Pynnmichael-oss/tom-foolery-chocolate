import { StripeDivider } from "@/components/ui/StripeDivider";

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
        {/* Stacked logo placeholder */}
        <svg
          viewBox="0 0 120 120"
          role="img"
          aria-label="Tom Foolery Chocolate mark"
          className="h-14 w-14"
          fill="none"
        >
          <circle cx="60" cy="60" r="56" stroke="currentColor" strokeWidth="3" />
          <path
            d="M38 74c6-20 14-32 22-32s16 12 22 32"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="60" cy="42" r="6" fill="currentColor" />
        </svg>
        <p className="font-featureDeck text-2xl">Tom Foolery Chocolate</p>
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
              className="font-sofia text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em] text-tf-white/80 transition-colors hover:text-tf-turmeric"
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
              className="font-sofia text-[length:var(--fs-preheader)] uppercase tracking-[0.075em] text-tf-white/60 transition-colors hover:text-tf-white"
            >
              {social.label}
            </a>
          ))}
        </div>

        <p className="font-sofia text-[length:var(--fs-preheader)] text-tf-white/40">
          © {new Date().getFullYear()} Tom Foolery Chocolate. Live a little.
        </p>
      </div>
    </footer>
  );
}
