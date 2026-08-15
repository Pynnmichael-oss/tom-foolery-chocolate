/** Plain string logic, deliberately NOT in Button.tsx: any export from a
 * "use client" file becomes uncallable from Server Components (only
 * renderable as a component), so this needs its own client-free module for
 * `buttonClasses()` to work when styling a plain `<a>`/`<Link>` from server
 * code (e.g. app/not-found.tsx, a Server Component). */

export type ButtonVariant = "primary" | "secondary";

// `motion-safe:`/`motion-reduce:` are Tailwind's built-in prefers-reduced-motion
// variants — the hover tilt/scale simply doesn't exist in the reduced-motion
// stylesheet, no JS branching needed.
const BASE =
  "inline-flex items-center justify-center gap-fluid-xs rounded-full px-fluid-md py-fluid-sm " +
  "font-sofia text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em] " +
  "transition-transform duration-200 ease-out cursor-pointer " +
  "motion-safe:hover:-rotate-1 motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50";

const VARIANT: Record<ButtonVariant, string> = {
  // tf-cinnamon-strong (not tf-cinnamon) — WCAG AA fix, see globals.css.
  primary: "bg-tf-cinnamon-strong text-tf-white hover:bg-tf-cinnamon-strong/90",
  // `current` so it inherits whatever --fg the surrounding section has set.
  secondary:
    "border-2 border-current bg-transparent text-current hover:bg-current/10",
};

/** Same classes `<Button>` applies internally — for the rare case something
 * needs to render as a real `<a>`/`<Link>` instead (external checkout
 * links, or a link inside a Server Component) without duplicating or
 * forking the styling. */
export function buttonClasses(variant: ButtonVariant = "primary", className = ""): string {
  return `${BASE} ${VARIANT[variant]} ${className}`;
}
