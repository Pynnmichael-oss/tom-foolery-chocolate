"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonClasses, type ButtonVariant } from "./buttonClasses";

export type { ButtonVariant };

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
