"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { buttonClasses } from "@/components/ui/buttonClasses";
import {
  JOIN_ANCHOR,
  JOIN_GIFT_ANCHOR,
  NOTIFY_ANCHOR,
  SALE_OPENS_LABEL,
  type SalePhase,
} from "@/lib/mischief-society/config";
import { useSalePhase } from "./useSalePhase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "Email me when doors open" — shown only before the sale opens
 * (renders nothing once doors open). Posts to
 * /api/mischief-society/notify, which subscribes the email in Omnisend.
 */
export function NotifyForm({
  initialPhase,
  tone = "light",
  anchor = false,
  className = "",
}: {
  initialPhase: SalePhase;
  /** Give this instance the #notify anchor (one per page). */
  anchor?: boolean;
  /** "light" for light backgrounds, "dark" on bg-tf-black. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const { phase } = useSalePhase(initialPhase);
  const uid = useId();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  // Pre-sale only: once doors open (or in ?test mode) the buttons return.
  if (phase !== "pre") return null;

  const heading = "Get the heads-up";
  const sub = `Doors open ${SALE_OPENS_LABEL}. We'll email you the minute they open.`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/mischief-society/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), website }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "We couldn't sign you up just now. Please try again in a moment.");
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setStatus("idle");
    }
  }

  const dark = tone === "dark";
  const panel = dark ? "bg-tf-white/10 text-tf-white" : "bg-tf-white text-tf-black";

  return (
    <div id={anchor ? NOTIFY_ANCHOR : undefined} className={`scroll-mt-24 rounded-2xl p-5 sm:p-6 ${panel} ${className}`}>
      {status === "done" ? (
        <p role="status">
          You&rsquo;re on the list. We&rsquo;ll email you when doors open.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <p className="text-sm font-black uppercase tracking-[0.075em]">{heading}</p>
          <p>{sub}</p>

          {/* Honeypot — see ContactForm.tsx. */}
          <label htmlFor={`${uid}-website`} className="sr-only" aria-hidden="true">
            Leave this field blank
          </label>
          <input
            id={`${uid}-website`}
            name="website"
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <label htmlFor={`${uid}-email`} className="sr-only">
              Email address
            </label>
            <input
              id={`${uid}-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${uid}-error` : `${uid}-fine`}
              className="min-w-0 flex-1 rounded-full border-[1.5px] border-tf-black/25 bg-tf-white px-5 py-3 text-base text-tf-black focus-visible:border-tf-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon aria-[invalid=true]:border-tf-cinnamon-strong"
            />
            <Button type="submit" disabled={status === "sending"} className="shrink-0">
              {status === "sending" ? "Sending…" : "Email Me"}
            </Button>
          </div>
          {error ? (
            <p id={`${uid}-error`} role="alert" className={`text-sm font-semibold ${dark ? "text-tf-rose" : "text-tf-cinnamon-strong"}`}>
              {error}
            </p>
          ) : (
            <p id={`${uid}-fine`} className={`text-xs ${dark ? "text-tf-white/70" : "text-tf-black/60"}`}>
              You&rsquo;ll also get the occasional Tom Foolery email. Unsubscribe anytime.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

/**
 * The hero's and closing section's call to action: the Join / Gift
 * buttons once the sale is open, the email signup before it.
 */
export function SocietyActions({
  initialPhase,
  anchor = false,
  center = false,
}: {
  initialPhase: SalePhase;
  anchor?: boolean;
  center?: boolean;
}) {
  const { phase } = useSalePhase(initialPhase);
  if (phase === "pre") {
    return (
      <NotifyForm
        initialPhase={initialPhase}
        anchor={anchor}
        className={`mt-fluid-xs w-full max-w-xl ${center ? "text-left" : ""}`}
      />
    );
  }
  return (
    <div className={`mt-fluid-xs flex flex-wrap gap-fluid-sm ${center ? "justify-center" : ""}`}>
      {/* Gifting leads during the holiday sale. */}
      <a href={`#${JOIN_GIFT_ANCHOR}`} className={buttonClasses("secondary")}>
        Gift a Membership
      </a>
      <a href={`#${JOIN_ANCHOR}`} className={buttonClasses("primary")}>
        Join the Society
      </a>
    </div>
  );
}
