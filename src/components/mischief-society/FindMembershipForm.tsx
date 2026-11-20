"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Welcome page: "email me my member link". Posts to
 * /api/mischief-society/member-link. */
export function FindMembershipForm() {
  const uid = useId();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/mischief-society/member-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), website }),
      });
      const data: { error?: string; message?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "We couldn't look that up just now. Please try again in a moment.");
        setStatus("idle");
        return;
      }
      setMessage(data.message ?? "If that email has a membership, its link is on the way.");
      setStatus("done");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <p role="status" className="min-w-0 rounded-2xl bg-tf-white p-5 font-display text-xl leading-snug font-semibold">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-w-0 flex-col gap-3 rounded-2xl bg-tf-white p-5 sm:p-6">
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
      <label htmlFor={`${uid}-email`} className="font-sans text-xs font-black tracking-[0.075em] uppercase">
        The email your membership was sent to
      </label>
      <div className="flex flex-col gap-2.5 sm:flex-row">
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
          aria-describedby={error ? `${uid}-error` : undefined}
          className="min-w-0 flex-1 rounded-full border-[1.5px] border-tf-black/25 bg-tf-white px-5 py-3 text-base text-tf-black focus-visible:border-tf-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon aria-[invalid=true]:border-tf-cinnamon-strong"
        />
        <Button type="submit" disabled={status === "sending"} className="shrink-0">
          {status === "sending" ? "Sending…" : "Email My Link"}
        </Button>
      </div>
      {error && (
        <p id={`${uid}-error`} role="alert" className="text-sm font-semibold text-tf-cinnamon-strong">
          {error}
        </p>
      )}
    </form>
  );
}
