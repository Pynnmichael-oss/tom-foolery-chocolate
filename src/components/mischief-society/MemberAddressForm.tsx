"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  EMPTY_ADDRESS,
  US_STATES,
  formatAddressLines,
  type AddressProblems,
  type ShippingAddress,
} from "@/lib/mischief-society/address";
import { saveAddressAction } from "@/app/mischief-society/member/actions";

const INPUT =
  "w-full rounded-lg border-[1.5px] border-tf-black/20 bg-tf-white px-3.5 py-3 text-base text-tf-black " +
  "focus-visible:border-tf-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon " +
  "aria-[invalid=true]:border-tf-cinnamon-strong";
const LABEL = "font-sans text-xs font-black tracking-[0.075em] uppercase";

/**
 * Shipping address on the private member page. Shows the saved address
 * with an Edit button, or the form when there isn't one yet.
 */
export function MemberAddressForm({
  token,
  initial,
}: {
  token: string;
  initial: ShippingAddress | null;
}) {
  const uid = useId();
  const [saved, setSaved] = useState<ShippingAddress | null>(initial);
  const [editing, setEditing] = useState(!initial);
  const [form, setForm] = useState<ShippingAddress>(initial ?? EMPTY_ADDRESS);
  const [problems, setProblems] = useState<AddressProblems>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ShippingAddress>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (problems[key]) setProblems((p) => ({ ...p, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const result = await saveAddressAction(token, form);
    setSaving(false);
    if (!result.ok) {
      setProblems(result.problems ?? {});
      setMessage({ ok: false, text: result.error });
      return;
    }
    setSaved(result.address);
    setForm(result.address);
    setEditing(false);
    setMessage({ ok: true, text: "Saved. Your chocolate knows where to go." });
  }

  const field = (key: keyof ShippingAddress) => ({
    id: `${uid}-${key}`,
    value: form[key],
    "aria-invalid": problems[key] ? true : undefined,
    "aria-describedby": problems[key] ? `${uid}-${key}-err` : undefined,
    className: INPUT,
  });
  const err = (key: keyof ShippingAddress) =>
    problems[key] ? (
      <p id={`${uid}-${key}-err`} className="text-sm font-semibold text-tf-cinnamon-strong">
        {problems[key]}
      </p>
    ) : null;

  if (!editing && saved) {
    return (
      <div className="flex flex-col gap-4">
        <address className="not-italic leading-relaxed">
          {formatAddressLines(saved).map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>
        {message && (
          <p role="status" className="rounded-xl bg-tf-juniper px-4 py-3 text-sm font-semibold">
            {message.text}
          </p>
        )}
        <div>
          <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
            Change address
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-name`} className={LABEL}>
          Name for the package
        </label>
        <input {...field("name")} autoComplete="name" onChange={(e) => set("name", e.target.value)} />
        {err("name")}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-address1`} className={LABEL}>
          Street address
        </label>
        <input {...field("address1")} autoComplete="address-line1" onChange={(e) => set("address1", e.target.value)} />
        {err("address1")}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-address2`} className={LABEL}>
          Apt, suite, etc. (optional)
        </label>
        <input {...field("address2")} autoComplete="address-line2" onChange={(e) => set("address2", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_0.8fr]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${uid}-city`} className={LABEL}>
            City
          </label>
          <input {...field("city")} autoComplete="address-level2" onChange={(e) => set("city", e.target.value)} />
          {err("city")}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${uid}-state`} className={LABEL}>
            State
          </label>
          <select {...field("state")} autoComplete="address-level1" onChange={(e) => set("state", e.target.value)}>
            <option value="">Choose…</option>
            {US_STATES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
          {err("state")}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${uid}-zip`} className={LABEL}>
            ZIP
          </label>
          <input
            {...field("zip")}
            autoComplete="postal-code"
            inputMode="numeric"
            onChange={(e) => set("zip", e.target.value)}
          />
          {err("zip")}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-phone`} className={LABEL}>
          Phone (optional, for delivery questions)
        </label>
        <input
          {...field("phone")}
          type="tel"
          autoComplete="tel"
          onChange={(e) => set("phone", e.target.value)}
        />
        {err("phone")}
      </div>
      <p className="text-sm text-tf-black/70">We ship within the US.</p>
      {message && !message.ok && (
        <p role="alert" className="rounded-xl bg-tf-rose px-4 py-3 text-sm font-semibold">
          {message.text}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save address"}
        </Button>
        {saved && (
          <button
            type="button"
            onClick={() => {
              setForm(saved);
              setProblems({});
              setMessage(null);
              setEditing(false);
            }}
            className="text-sm font-semibold underline underline-offset-4"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
