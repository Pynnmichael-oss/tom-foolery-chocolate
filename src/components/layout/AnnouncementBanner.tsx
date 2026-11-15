"use client";

import { usePathname } from "next/navigation";
import type { Announcement, AnnouncementStyle } from "@/lib/shopify/types";

/** Routes that show the banner. Exact paths only — `/shop` does not
 * include product pages under `/shop/[handle]`. */
const BANNER_PATHS = new Set(["/", "/story", "/shop", "/contact"]);

/* Text colors chosen for WCAG AA: white only on the two dark brand colors
 * (cinnamon uses the -strong variant — plain cinnamon fails with white). */
const STYLE_CLASSES: Record<AnnouncementStyle, { bar: string; link: string }> = {
  cinnamon: { bar: "bg-tf-cinnamon-strong text-tf-white", link: "decoration-tf-white/60" },
  black: { bar: "bg-tf-black text-tf-white", link: "decoration-tf-white/60" },
  turmeric: { bar: "bg-tf-turmeric text-tf-black", link: "decoration-tf-black/60" },
  juniper: { bar: "bg-tf-juniper text-tf-black", link: "decoration-tf-black/60" },
  rose: { bar: "bg-tf-rose text-tf-black", link: "decoration-tf-black/60" },
};

/**
 * Full-width bar above the sticky Nav (so it scrolls away and the nav
 * stays pinned). Content comes from Shopify — see
 * lib/shopify/announcement.ts. Rendered from the root layout so it sits
 * above the nav; the path check here limits it to BANNER_PATHS, and
 * because usePathname also runs during SSR the banner is in the initial
 * HTML on those pages (no layout shift).
 */
export function AnnouncementBanner({ announcement }: { announcement: Announcement | null }) {
  const pathname = usePathname();
  if (!announcement || !BANNER_PATHS.has(pathname)) return null;

  const { bar, link } = STYLE_CLASSES[announcement.style];

  return (
    <aside aria-label="Announcement" className={`w-full ${bar}`}>
      <p className="mx-auto max-w-6xl px-fluid-md py-2 text-center font-sans text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em]">
        {announcement.message}
        {announcement.link && (
          <>
            {" "}
            <a
              href={announcement.link.href}
              className={`whitespace-nowrap underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${link}`}
            >
              {announcement.link.label} →
            </a>
          </>
        )}
      </p>
    </aside>
  );
}
