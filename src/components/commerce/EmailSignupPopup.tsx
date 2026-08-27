"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { PrimaryLogo } from "@/components/ui/logos";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { useMediaPreferences } from "@/lib/hooks/useMediaPreferences";
import { subscribeCustomerAction } from "@/lib/shopify/actions";

const DISMISS_KEY = "tf_signup_dismissed";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_KEY = "tf_signup_shown";
const OPEN_DELAY_MS = 1500;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function isSuppressed(): boolean {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return true;
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (!dismissedAt) return false;
    return Date.now() - Number(dismissedAt) < DISMISS_MS;
  } catch {
    // Storage unavailable (private mode, disabled cookies, etc.) — fail
    // open rather than never showing the popup at all.
    return false;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Ignore — worst case the popup reappears next load.
  }
}

/**
 * Root-layout-mounted email capture popup. Appears once per browser
 * session, 1.5s after first mount, unless the visitor dismissed it (or
 * signed up) within the last 7 days — see `isSuppressed`. Mounted once at
 * `RootLayout` (not per-page), so App Router client-side navigations never
 * retrigger it: the layout tree above `{children}` doesn't remount on
 * route change, only on a hard/full page load.
 *
 * Entrance is GSAP (scale 0.96 -> 1 + fade, ~300ms, power2.out), gated by
 * `prefers-reduced-motion` the same way every other motion-aware component
 * in this codebase is (see ScrollPrompt.tsx) — reduced motion drops the
 * scale and animates opacity only.
 */
export function EmailSignupPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const { prefersReducedMotion } = useMediaPreferences();

  // Schedule the one-time appearance.
  useEffect(() => {
    if (isSuppressed()) return;

    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // Ignore — worst case it can reopen later this session.
      }
      setOpen(true);
    }, OPEN_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  // Move focus into the modal on open, restore it on close.
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      closeButtonRef.current?.focus();
    } else {
      previouslyFocusedRef.current?.focus?.();
    }
  }, [open]);

  // ESC to close + Tab focus trap.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dismiss();
        return;
      }
      if (event.key !== "Tab" || !cardRef.current) return;

      const focusable = Array.from(
        cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Entrance: scale + fade (or, under reduced motion, opacity only).
  useGSAP(
    () => {
      if (!open || !cardRef.current) return;

      if (prefersReducedMotion) {
        gsap.fromTo(
          cardRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power2.out" }
        );
      } else {
        gsap.fromTo(
          cardRef.current,
          { opacity: 0, scale: 0.96 },
          { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
        );
      }
    },
    { dependencies: [open, prefersReducedMotion] }
  );

  function dismiss() {
    markDismissed();
    setOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setError(null);

    // TODO(storefront): if this project ever moves off the shared
    // Storefront API client in src/lib/shopify/, point this at whatever
    // replaces it — subscribeCustomerAction (src/lib/shopify/actions.ts)
    // wraps a real `customerCreate` mutation (src/lib/shopify/queries.ts)
    // already wired to SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    // with a mock fallback when those env vars aren't set.
    const result = await subscribeCustomerAction(email);

    if (result.success) {
      setStatus("success");
      markDismissed();
    } else {
      setStatus("idle");
      setError(result.error ?? "Something went wrong. Please try again.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop — purely visual; the centering wrapper below sits on top
       * of it (same full-viewport size, later in paint order) and owns the
       * actual click-to-dismiss handling, since a click anywhere in that
       * wrapper other than the card itself is "the backdrop" visually. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-tf-black/50 transition-opacity duration-300 motion-reduce:transition-none"
      />

      {/* Card */}
      <div
        onClick={dismiss}
        className="relative flex h-full w-full items-center justify-center p-fluid-md"
      >
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tf-signup-headline"
          onClick={(event) => event.stopPropagation()}
          className="relative w-full max-w-[440px] rounded-[8px] bg-tf-white p-fluid-lg text-center shadow-2xl"
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="absolute right-fluid-sm top-fluid-sm rounded-full p-2 text-tf-black transition-colors hover:text-tf-cinnamon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>

          <PrimaryLogo tone="positive" width={220} className="mx-auto mb-fluid-md" title="Tom Foolery" />

          {status === "success" ? (
            <div className="flex flex-col gap-fluid-sm py-fluid-sm">
              <h2
                id="tf-signup-headline"
                className="font-display font-semibold text-tf-black"
                // Brand guide Header rule: line-height = type size + 12pt
                // (see typography.tsx's Headline, which this mirrors at a
                // popup-specific ~28-32px size rather than one of its
                // section-scale presets).
                style={{ fontSize: "clamp(1.75rem, 1.6rem + 0.5vw, 2rem)", lineHeight: "calc(1em + 16px)" }}
              >
                You&rsquo;re In!
              </h2>
              <p className="font-sans text-sm italic text-tf-black/60">
                Keep an eye on your inbox for your 10% off code.
              </p>
            </div>
          ) : (
            <>
              <h2
                id="tf-signup-headline"
                className="font-display font-semibold text-tf-black"
                style={{ fontSize: "clamp(1.75rem, 1.6rem + 0.5vw, 2rem)", lineHeight: "calc(1em + 16px)" }}
              >
                Get 10% Off Your First Order
              </h2>
              <p className="mt-fluid-xs font-sans text-sm italic text-tf-black/60">
                And be the first to hear about our new product drops!
              </p>

              <form onSubmit={handleSubmit} className="mt-fluid-md flex flex-col gap-fluid-sm text-left" noValidate>
                <div>
                  <label htmlFor="tf-signup-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="tf-signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "tf-signup-error" : undefined}
                    className="w-full rounded-[4px] border-[1.5px] border-tf-black bg-tf-white px-fluid-sm py-fluid-xs font-sans text-tf-black placeholder:text-tf-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon"
                  />
                  {error ? (
                    <p id="tf-signup-error" className="mt-fluid-xs font-sans text-sm text-tf-cinnamon-strong">
                      {error}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full rounded-[4px] border-[1.5px] border-tf-black bg-tf-white py-fluid-sm font-sans text-sm font-black uppercase tracking-[0.075em] text-tf-black transition-colors duration-200 hover:bg-tf-black hover:text-tf-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "submitting" ? "Submitting…" : "Get 10% Off"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
