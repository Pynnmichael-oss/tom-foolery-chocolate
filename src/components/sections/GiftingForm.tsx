"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ORDER_SIZE_OPTIONS, PRODUCT_OPTIONS } from "@/lib/gifting/constants";
import type { OrderSize, ProductOption } from "@/lib/gifting/constants";

type Status = "idle" | "submitting" | "success";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Permissive on purpose — this is a lead form, not a carrier lookup.
// Accepts digits plus common separators/formatting, 7-20 characters.
const PHONE_RE = /^[0-9+()\-.\s]{7,20}$/;

// Same input/label treatment ContactForm already established for this
// brand (border-tf-black, cinnamon focus ring, cinnamon-strong error
// copy) — reused here rather than inventing a second form language.
const FIELD_CLASS =
  "w-full rounded-[4px] border-[1.5px] border-tf-black bg-tf-white px-fluid-sm py-fluid-xs font-sans text-tf-black placeholder:text-tf-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon";
const LABEL_CLASS = "font-sans text-sm font-black uppercase tracking-[0.075em] text-fg/70";
// Same legend styling ProductDetail.tsx already uses for its own option
// groups — reused for this form's two fieldsets.
const LEGEND_CLASS =
  "mb-fluid-sm font-sans text-sm font-black uppercase tracking-[0.075em] text-fg/70";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

interface FormState {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  orderSize: OrderSize | "";
  products: ProductOption[];
  timeline: string;
  message: string;
}

const INITIAL_STATE: FormState = {
  firstName: "",
  lastName: "",
  companyName: "",
  email: "",
  phone: "",
  orderSize: "",
  products: [],
  timeline: "",
  message: "",
};

/** Mirrors the server's own validation in `/api/gifting/route.ts` — purely
 * for UX (instant feedback, no round-trip); the route re-checks everything
 * itself since a request can always bypass the browser. */
function clientError(form: FormState): string | null {
  if (!form.firstName.trim()) return "Enter your first name.";
  if (!form.lastName.trim()) return "Enter your last name.";
  if (!EMAIL_RE.test(form.email.trim())) return "Enter a valid email address.";
  if (!PHONE_RE.test(form.phone.trim())) return "Enter a valid phone number.";
  if (!form.orderSize) return "Select an estimated order size.";
  if (!form.message.trim()) return "Tell us a bit about what you're thinking.";
  return null;
}

/**
 * Corporate Gifting inquiry form — posts to `/api/gifting` (same
 * Resend-backed pattern as `ContactForm`/`/api/contact`). Grouped into two
 * `<fieldset>`s (Your Info / Your Gift) so nine fields read as two
 * digestible chunks instead of one long flat list — the brief's own
 * "premium and clean, not cluttered" ask, given how many fields this form
 * genuinely needs.
 */
export function GiftingForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleProduct(product: ProductOption) {
    setForm((prev) => ({
      ...prev,
      products: prev.products.includes(product)
        ? prev.products.filter((p) => p !== product)
        : [...prev.products, product],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const validationError = clientError(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/gifting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      <div className="flex flex-col gap-fluid-sm py-fluid-lg text-center" role="status">
        <p className="font-display text-2xl font-semibold text-fg">Inquiry Sent!</p>
        <p className="font-sans text-fg/70">
          Thanks for reaching out — someone from our team will be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-fluid-xl text-left" noValidate>
      <fieldset className="flex flex-col gap-fluid-md">
        <legend className={LEGEND_CLASS}>Your Info</legend>

        <div className="grid grid-cols-1 gap-fluid-md sm:grid-cols-2">
          <div className="flex flex-col gap-fluid-xs">
            <label htmlFor="tf-gifting-first-name" className={LABEL_CLASS}>
              First Name
            </label>
            <input
              id="tf-gifting-first-name"
              type="text"
              autoComplete="given-name"
              required
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="Jamie"
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-fluid-xs">
            <label htmlFor="tf-gifting-last-name" className={LABEL_CLASS}>
              Last Name
            </label>
            <input
              id="tf-gifting-last-name"
              type="text"
              autoComplete="family-name"
              required
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Rivera"
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-fluid-xs">
            <label htmlFor="tf-gifting-company" className={LABEL_CLASS}>
              Company Name
            </label>
            <input
              id="tf-gifting-company"
              type="text"
              autoComplete="organization"
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              placeholder="Optional"
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-fluid-xs">
            <label htmlFor="tf-gifting-email" className={LABEL_CLASS}>
              Email
            </label>
            <input
              id="tf-gifting-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-fluid-xs">
            <label htmlFor="tf-gifting-phone" className={LABEL_CLASS}>
              Phone
            </label>
            <input
              id="tf-gifting-phone"
              type="tel"
              autoComplete="tel"
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="(555) 555-5555"
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-fluid-xs">
            <label htmlFor="tf-gifting-order-size" className={LABEL_CLASS}>
              Estimated Order Size
            </label>
            <div className="relative">
              <select
                id="tf-gifting-order-size"
                required
                value={form.orderSize}
                onChange={(e) => update("orderSize", e.target.value as OrderSize)}
                className={`${FIELD_CLASS} appearance-none pr-fluid-lg`}
              >
                <option value="" disabled>
                  Choose one
                </option>
                {ORDER_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="pointer-events-none absolute right-fluid-sm top-1/2 h-4 w-4 -translate-y-1/2 text-tf-black/60"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-fluid-md">
        <legend className={LEGEND_CLASS}>Your Gift</legend>

        <div className="flex flex-col gap-fluid-xs">
          <span className={LABEL_CLASS}>Products You&rsquo;re Interested In</span>
          <div className="flex flex-wrap gap-fluid-md">
            {PRODUCT_OPTIONS.map((product) => (
              <label
                key={product}
                className="flex items-center gap-fluid-xs font-sans text-tf-black"
              >
                <input
                  type="checkbox"
                  checked={form.products.includes(product)}
                  onChange={() => toggleProduct(product)}
                  className="h-4 w-4 accent-tf-cinnamon-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon"
                />
                {product}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-fluid-xs">
          <label htmlFor="tf-gifting-timeline" className={LABEL_CLASS}>
            Timeline
          </label>
          <p className="font-sans text-sm italic text-tf-black/60">
            When do you need the gifts in your recipients&rsquo; hands by?
          </p>
          <input
            id="tf-gifting-timeline"
            type="date"
            min={TODAY_ISO}
            value={form.timeline}
            onChange={(e) => update("timeline", e.target.value)}
            title="When do you need the gifts in your recipients' hands by?"
            className={`${FIELD_CLASS} sm:max-w-xs`}
          />
        </div>

        <div className="flex flex-col gap-fluid-xs">
          <label htmlFor="tf-gifting-message" className={LABEL_CLASS}>
            Tell Us More About What You&rsquo;re Thinking
          </label>
          <textarea
            id="tf-gifting-message"
            required
            rows={5}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder="What's the occasion, who's it for, anything else we should know?"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "tf-gifting-error" : undefined}
            className={`${FIELD_CLASS} resize-y`}
          />
        </div>
      </fieldset>

      {error ? (
        <p id="tf-gifting-error" role="alert" className="font-sans text-sm text-tf-cinnamon-strong">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        disabled={status === "submitting"}
        className="w-full sm:w-auto sm:self-start"
      >
        {status === "submitting" ? "Sending…" : "Send Inquiry"}
      </Button>
    </form>
  );
}
