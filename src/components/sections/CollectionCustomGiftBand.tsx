"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP, breakpoints } from "@/components/motion/gsap";
import { Headline, BodyText } from "@/components/ui/typography";
import { EyesHatIcon } from "@/components/ui/logos";
import { useScrollToGiftingForm } from "@/lib/hooks/useScrollToGiftingForm";

const CTA_CLASS =
  "inline-flex items-center justify-center rounded-full bg-tf-white px-fluid-md py-fluid-sm " +
  "font-sans text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em] text-tf-black cursor-pointer " +
  "transition-transform duration-200 ease-out " +
  "motion-safe:hover:-rotate-1 motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-white focus-visible:ring-offset-2 focus-visible:ring-offset-tf-black";

/**
 * "Make it custom" band below a collection's products — brand-black
 * background, white text, pointing visitors at the gifting inquiry form
 * (`useScrollToGiftingForm` + href="/gifting#custom-gift": on THIS page
 * `#custom-gift` doesn't exist, so the hook's getElementById lookup finds
 * nothing and no-ops, leaving the plain link to navigate to /gifting and
 * land on the anchor there — same hook, same behavior, two different
 * pages). The eyes-and-hat mark peeks out of a turmeric badge straddling
 * the band's top edge, echoing the "Live a Little" badge on the gifting
 * hero rather than inventing a new motif.
 */
export function CollectionCustomGiftBand() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollToForm = useScrollToGiftingForm();

  useGSAP(
    () => {
      const root = sectionRef.current;
      if (!root) return;
      const els = root.querySelectorAll<HTMLElement>("[data-custom-band-reveal]");
      if (els.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add(breakpoints.reducedMotion, () => {
        gsap.set(els, { opacity: 1, y: 0 });
      });

      mm.add(breakpoints.motionOK, () => {
        gsap.set(els, { opacity: 0, y: 28 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root, start: "top 85%", once: true },
        });
        tl.to(els, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", stagger: 0.1 });

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
    <section
      ref={sectionRef}
      className="relative mt-fluid-2xl bg-tf-black px-fluid-md py-fluid-2xl text-center text-tf-white"
    >
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-tf-turmeric sm:size-20"
      >
        <EyesHatIcon tone="positive" width={34} />
      </div>

      <div className="mx-auto flex max-w-2xl flex-col items-center gap-fluid-md pt-fluid-sm">
        <div data-custom-band-reveal>
          <Headline as="h2" size="sm" className="text-tf-white">
            Don&rsquo;t see quite the right thing?
          </Headline>
        </div>
        <div data-custom-band-reveal>
          <BodyText className="text-tf-white/85">
            We&rsquo;ll build a custom gift for your crew, your clients, or your favorite person.
          </BodyText>
        </div>
        <div data-custom-band-reveal>
          <Link href="/gifting#custom-gift" onClick={scrollToForm} className={CTA_CLASS}>
            Make It Custom
          </Link>
        </div>
      </div>
    </section>
  );
}
