"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary";

// `motion-safe:`/`motion-reduce:` are Tailwind's built-in prefers-reduced-motion
// variants — the hover tilt/scale simply doesn't exist in the reduced-motion
// stylesheet, no JS branching needed.
const BASE =
  "inline-flex items-center justify-center gap-fluid-xs rounded-full px-fluid-md py-fluid-sm " +
  "font-sofia text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.05em] " +
  "transition-transform duration-200 ease-out cursor-pointer " +
  "motion-safe:hover:-rotate-1 motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-tf-cinnamon text-tf-white hover:bg-tf-cinnamon/90",
  // `current` so it inherits whatever --fg the surrounding section has set.
  secondary:
    "border-2 border-current bg-transparent text-current hover:bg-current/10",
};

/** Same classes the `<button>` below gets — for the rare case something
 * needs to render as a real `<a>` instead (external checkout links can't
 * be a `<button onClick>`) without duplicating or forking the styling. */
export function buttonClasses(variant: ButtonVariant = "primary", className = ""): string {
  return `${BASE} ${VARIANT[variant]} ${className}`;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", className = "", type = "button", children, ...rest },
    ref
  ) {
    return (
      <button ref={ref} type={type} className={buttonClasses(variant, className)} {...rest}>
        {children}
      </button>
    );
  }
);
