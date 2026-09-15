"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";

type Status = "idle" | "submitting" | "success";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same input/label treatment EmailSignupPopup already established for
// this brand (border-tf-black, cinnamon focus ring, cinnamon-strong error
// copy) — reused here rather than inventing a second form language.
const FIELD_CLASS =
  "w-full rounded-[4px] border-[1.5px] border-tf-black bg-tf-white px-fluid-sm py-fluid-xs font-sans text-tf-black placeholder:text-tf-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon";

/**
 * Contact form — posts to `/api/contact` (Resend under the hood, see that
 * route's own comments). Client-side validation here is purely UX — the
 * route re-validates everything itself, since a request can always bypass
 * the browser.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  function clientError(): string | null {
    if (!name.trim()) return "Enter your name.";
    if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
    if (!message.trim()) return "Enter a message.";
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const validationError = clientError();
    if (validationError) {
      setError(validationError);
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus("idle");
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("idle");
      setError("Something went wrong. Please check your connection and try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col gap-fluid-sm py-fluid-sm text-center" role="status">
        <p className="font-display text-2xl font-semibold text-fg">Message Sent!</p>
        <p className="font-sans text-fg/70">
          Thanks for reaching out — we&rsquo;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-fluid-md text-left" noValidate>
      <div className="flex flex-col gap-fluid-xs">
        <label htmlFor="tf-contact-name" className="font-sans text-sm font-black uppercase tracking-[0.075em] text-fg/70">
          Name
        </label>
        <input
          id="tf-contact-name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-fluid-xs">
        <label htmlFor="tf-contact-email" className="font-sans text-sm font-black uppercase tracking-[0.075em] text-fg/70">
          Email
        </label>
        <input
          id="tf-contact-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-fluid-xs">
        <label htmlFor="tf-contact-message" className="font-sans text-sm font-black uppercase tracking-[0.075em] text-fg/70">
          Message
        </label>
        <textarea
          id="tf-contact-message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What's on your mind?"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "tf-contact-error" : undefined}
          className={`${FIELD_CLASS} resize-y`}
        />
      </div>

      {error ? (
        <p id="tf-contact-error" role="alert" className="font-sans text-sm text-tf-cinnamon-strong">
          {error}
        </p>
      ) : null}

      {/* `sm:w-auto` alone doesn't stop this from stretching — the form is
       * a flex column, and `align-items: stretch` (its default) stretches
       * any child whose cross-axis size computes to `auto`, which
       * `width: auto` *is* whether set explicitly or left unset. `self-start`
       * opts this one item out of stretch so `w-auto` actually takes over. */}
      <Button
        type="submit"
        variant="primary"
        disabled={status === "submitting"}
        className="w-full sm:w-auto sm:self-start"
      >
        {status === "submitting" ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
