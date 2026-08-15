export interface MarqueeProps {
  className?: string;
  /** Seconds for one full loop. */
  duration?: number;
}

const MARQUEE_TEXT =
  "LIVE A LITTLE • A LITTLE FUN ALWAYS TASTES BETTER • CHOCOLATE AS INTERESTING AS IT IS IRRESISTIBLE •";

/**
 * Infinite horizontal ticker. Pure CSS `animation` (the `marquee` keyframe
 * lives in tailwind.config.ts) — no GSAP, no JS. Content is duplicated so a
 * -50% translateX loop is seamless. `motion-reduce:animate-none` freezes it
 * at rest under reduced motion, no scripting required.
 */
export function Marquee({ className = "", duration }: MarqueeProps) {
  return (
    <div
      className={`overflow-hidden whitespace-nowrap ${className}`}
      aria-hidden="true"
    >
      <div
        className="flex w-max animate-marquee motion-reduce:animate-none"
        style={duration ? { animationDuration: `${duration}s` } : undefined}
      >
        {[0, 1].map((i) => (
          <span
            key={i}
            className="px-fluid-md font-sans text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em]"
          >
            {MARQUEE_TEXT}
          </span>
        ))}
      </div>
    </div>
  );
}
