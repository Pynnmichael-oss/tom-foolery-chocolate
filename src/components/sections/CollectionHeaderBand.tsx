"use client";

import { useRef } from "react";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { StripeDivider } from "@/components/ui/StripeDivider";

export interface CollectionHeaderBandProps {
  title: string;
  description: string;
}

/**
 * Full-width rose header band for /collections/[handle] — preheader,
 * collection title, and description (capped ~60ch so it never runs the
 * full band width on desktop), with a black/white StripeDivider drawn
 * along the bottom edge. Text rises in on scroll via the same html.js
 * pre-paint pattern GiftingHeroGraphic/HeritageBeat use (globals.css
 * `[data-collection-reveal]`) — reduced-motion and no-JS visitors just
 * see the final, static state.
 */
export function CollectionHeaderBand({ title, description }: CollectionHeaderBandProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = sectionRef.current;
      if (!root) return;
      const pre = root.querySelector<HTMLElement>('[data-collection-reveal="pre"]');
      const heading = root.querySelector<HTMLElement>('[data-collection-reveal="title"]');
      const desc = root.querySelector<HTMLElement>('[data-collection-reveal="desc"]');

      const mm = gsap.matchMedia();

      mm.add(breakpoints.motionOK, () => {
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: { trigger: root, start: "top 85%", once: true },
        });

        if (pre) tl.fromTo(pre, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0);
        if (heading) tl.fromTo(heading, { y: 28 }, { y: 0, duration: 0.7 }, 0.08);
        if (desc) tl.fromTo(desc, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.18);

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden" style={{ backgroundColor: "var(--tf-rose)" }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-fluid-sm px-fluid-md py-fluid-xl text-tf-black">
        <div data-collection-reveal="pre">
          <Preheader>Gifting</Preheader>
        </div>
        <div data-collection-reveal="title">
          <Headline as="h1" size="md">
            {title}
          </Headline>
        </div>
        {description && (
          <div data-collection-reveal="desc">
            <BodyText className="max-w-[60ch] text-tf-black/80">{description}</BodyText>
          </div>
        )}
      </div>

      <StripeDivider />
    </section>
  );
}
