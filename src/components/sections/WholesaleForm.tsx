"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import {
  BUSINESS_TYPE_OPTIONS,
  WHOLESALE_FORM_FIRST_FIELD,
} from "@/lib/wholesale/constants";
import type { BusinessType } from "@/lib/wholesale/constants";

type Status = "idle" | "submitting" | "success";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-.\s]{7,20}$/;

// Same field/label/legend language as GiftingForm and ContactForm.
const FIELD_CLASS =
  "w-full rounded-[4px] border-[1.5px] border-tf-black bg-tf-white px-fluid-sm py-fluid-xs font-sans text-tf-black placeholder:text-tf-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon";
const LABEL_CLASS = "font-sans text-sm font-black uppercase tracking-[0.075em] text-fg/70";
const LEGEND_CLASS =
  "mb-fluid-sm font-sans text-sm font-black uppercase tracking-[0.075em] text-fg/70";

interface FormState {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string;
  businessType: BusinessType | "";
  location: string;
  storeUrl: string;
  message: string;
}

const INITIAL_STATE: FormState = {
  firstName: "",
  lastName: "",
  businessName: "",
  email: "",
  phone: "",
  businessType: "",
  location: "",
  storeUrl: "",
  message: "",
};

/** Mirrors `/api/wholesale/route.ts`'s validation, for instant feedback. */
function clientError(form: FormState): string | null {
  if (!form.firstName.trim()) return "Enter your first name.";
  if (!form.lastName.trim()) return "Enter your last name.";
  if (!form.businessName.trim()) return "Enter your business name.";
  if (!EMAIL_RE.test(form.email.trim())) return "Enter a valid email address.";
  if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) return "Enter a valid phone number.";
  if (!form.businessType) return "Select your type of business.";
  if (!form.location.trim()) return "Enter your city and state.";
  if (!form.message.trim()) return "Tell us a bit about what you're looking for.";
  return null;
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}

function TextField({ id, label, value, onChange, type = "text", autoComplete, placeholder, required }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-fluid-xs">
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={FIELD_CLASS}
      />
    </div>
  );
}

/**
 * Wholesale inquiry form for buyers who aren't ordering through Faire
 * (distributors, hospitality, corporate, larger/custom volume) — posts to
 * `/api/wholesale`, same Resend-backed pattern as GiftingForm.
 */
export function WholesaleForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  // Honeypot — see GiftingForm for the pattern.
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      const response = await fetch("/api/wholesale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website }),
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
          Thanks for your interest in carrying Tom Foolery — we&rsquo;ll be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-fluid-xl text-left" noValidate>
      <label htmlFor="tf-wholesale-website" className="sr-only" aria-hidden="true">
        Leave this field blank
      </label>
      <input
        id="tf-wholesale-website"
        name="website"
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
      />

      <fieldset className="flex flex-col gap-fluid-md">
        <legend className={LEGEND_CLASS}>Your Info</legend>
        <div className="grid grid-cols-1 gap-fluid-md sm:grid-cols-2">
          <TextField
            id={WHOLESALE_FORM_FIRST_FIELD}
            label="First Name"
            autoComplete="given-name"
            required
            value={form.firstName}
            onChange={(v) => update("firstName", v)}
            placeholder="Jamie"
          />
          <TextField
            id="tf-wholesale-last-name"
            label="Last Name"
            autoComplete="family-name"
            required
            value={form.lastName}
            onChange={(v) => update("lastName", v)}
            placeholder="Rivera"
          />
          <TextField
            id="tf-wholesale-email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(v) => update("email", v)}
            placeholder="you@yourshop.com"
          />
          <TextField
            id="tf-wholesale-phone"
            label="Phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(v) => update("phone", v)}
            placeholder="Optional"
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-fluid-md">
        <legend className={LEGEND_CLASS}>Your Business</legend>
        <div className="grid grid-cols-1 gap-fluid-md sm:grid-cols-2">
          <TextField
            id="tf-wholesale-business"
            label="Business Name"
            autoComplete="organization"
            required
            value={form.businessName}
            onChange={(v) => update("businessName", v)}
            placeholder="The Corner Shop"
          />

          <div className="flex flex-col gap-fluid-xs">
            <label htmlFor="tf-wholesale-type" className={LABEL_CLASS}>
              Type of Business
            </label>
            <div className="relative">
              <select
                id="tf-wholesale-type"
                required
                value={form.businessType}
                onChange={(e) => update("businessType", e.target.value as BusinessType)}
                className={`${FIELD_CLASS} appearance-none pr-fluid-lg`}
              >
                <option value="" disabled>
                  Choose one
                </option>
                {BUSINESS_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
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

          <TextField
            id="tf-wholesale-location"
            label="City & State"
            autoComplete="address-level2"
            required
            value={form.location}
            onChange={(v) => update("location", v)}
            placeholder="Chicago, IL"
          />
          <TextField
            id="tf-wholesale-url"
            label="Website or Instagram"
            autoComplete="url"
            value={form.storeUrl}
            onChange={(v) => update("storeUrl", v)}
            placeholder="Optional"
          />
        </div>

        <div className="flex flex-col gap-fluid-xs">
          <label htmlFor="tf-wholesale-message" className={LABEL_CLASS}>
            What Are You Looking For?
          </label>
          <textarea
            id="tf-wholesale-message"
            required
            rows={5}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder="Which bars, roughly how many cases, how often — anything that helps us put together the right fit."
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "tf-wholesale-error" : undefined}
            className={`${FIELD_CLASS} resize-y`}
          />
        </div>
      </fieldset>

      {error ? (
        <p id="tf-wholesale-error" role="alert" className="font-sans text-sm text-tf-cinnamon-strong">
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
