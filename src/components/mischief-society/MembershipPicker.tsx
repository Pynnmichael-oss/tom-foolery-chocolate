"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/commerce/CartProvider";
import { Button } from "@/components/ui/Button";
import { EyesHatIcon } from "@/components/ui/logos";
import { Preheader, Headline } from "@/components/ui/typography";
import { trackAddToCart } from "@/lib/analytics/ga";
import type { CartLineInput, Money, Product, ProductVariant } from "@/lib/shopify/types";
import {
  GIFT_DATE_DEFAULT,
  GIFT_DATE_MAX,
  GIFT_DATE_MIN,
  GIFT_NOTE_MAX,
  JOIN_ANCHOR,
  JOIN_GIFT_ANCHOR,
  NAME_MAX,
  NOTIFY_ANCHOR,
  SALE_OPENS_LABEL,
  societyToday,
  type SalePhase,
  type TierBars,
} from "@/lib/mischief-society/config";
import {
  formatGiftDate,
  giftAttributes,
  parseRecipientList,
  validateRecipients,
  type GiftProblem,
} from "@/lib/mischief-society/gifts";
import { useSalePhase } from "./useSalePhase";

export interface PickerTier {
  bars: TierBars;
  name: string;
  price: Money;
  /** null while the product can't be read from Shopify (draft, not on
   * the Headless channel) — the page still renders, Add to Cart is off. */
  variant: ProductVariant | null;
}

interface Recipient {
  key: number;
  name: string;
  email: string;
  sendDate: string;
  note: string;
  bars: TierBars;
}

type Field = GiftProblem["field"];
type Problems = Record<number, Partial<Record<Field, string>>>;

/** "$155" for whole amounts, "$155.50" otherwise. */
function formatMoney({ amount, currencyCode }: Money): string {
  const value = Number(amount);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  } catch {
    return `${amount} ${currencyCode}`;
  }
}

let nextKey = 1;
function blankRecipient(sendDate = GIFT_DATE_DEFAULT, bars: TierBars = 3): Recipient {
  return { key: nextKey++, name: "", email: "", sendDate, note: "", bars };
}

const INPUT =
  "w-full rounded-lg border-[1.5px] border-tf-black/20 bg-tf-white px-3.5 py-3 text-base text-tf-black " +
  "focus-visible:border-tf-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon " +
  "aria-[invalid=true]:border-tf-cinnamon-strong";
const LABEL = "font-sans text-xs font-black tracking-[0.075em] uppercase";
const ERROR = "text-sm font-semibold text-tf-cinnamon-strong";

export function MembershipPicker({
  tiers,
  product,
  initialPhase,
}: {
  tiers: PickerTier[];
  product: Pick<Product, "title" | "handle" | "images">;
  initialPhase: SalePhase;
}) {
  const { addLines } = useCart();
  // `now` is null until the browser has the clock (keeps SSR and the
  // first client render identical), then ticks every 30s.
  const { phase, now } = useSalePhase(initialPhase);
  const today = now === null ? null : societyToday(new Date(now));
  const uid = useId();

  const [mode, setMode] = useState<"me" | "gift">("me");
  const [selfBars, setSelfBars] = useState<TierBars>(3);
  const [from, setFrom] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>(() => [{ ...blankRecipient(), key: 0 }]);
  const [meToo, setMeToo] = useState(false);
  const [meTooBars, setMeTooBars] = useState<TierBars>(3);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteMsg, setPasteMsg] = useState("");
  const [problems, setProblems] = useState<Problems>({});
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  // "Gift a Membership" links land on #join-gift: preselect gifting.
  useEffect(() => {
    const apply = () => {
      if (window.location.hash === `#${JOIN_GIFT_ANCHOR}`) setMode("gift");
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const minDate = today && today > GIFT_DATE_MIN ? today : GIFT_DATE_MIN;
  const tierFor = (bars: TierBars) => tiers.find((t) => t.bars === bars) ?? tiers[0];

  const lines = useMemo(() => {
    const out: Array<{ label: string; bars: TierBars; date?: string }> = [];
    if (mode === "me") {
      out.push({ label: "For me", bars: selfBars });
    } else {
      recipients.forEach((r, i) =>
        out.push({ label: r.name.trim() || `Gift ${i + 1}`, bars: r.bars, date: r.sendDate })
      );
      if (meToo) out.push({ label: "For me", bars: meTooBars });
    }
    return out;
  }, [mode, selfBars, recipients, meToo, meTooBars]);

  const currency = tiers[0]?.price.currencyCode ?? "USD";
  const total = lines.reduce((sum, l) => sum + Number(tierFor(l.bars).price.amount), 0);
  const unavailable = lines.some((l) => {
    const v = tierFor(l.bars).variant;
    return !v || !v.availableForSale;
  });

  const buttonLabel = adding
    ? "Adding…"
    : phase === "pre"
      ? `Opens ${SALE_OPENS_LABEL.split(", ")[1] ?? SALE_OPENS_LABEL}`
      : phase === "closed"
        ? "Closed for this season"
        : unavailable
          ? "Not available yet"
          : "Add to Cart";
  const canAdd = phase === "live" && !unavailable && !adding;

  function updateRecipient(key: number, patch: Partial<Recipient>) {
    setRecipients((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    setFeedback((f) => (f && !f.ok ? null : f));
    const fields = Object.keys(patch) as Field[];
    setProblems((p) => {
      if (!p[key]) return p;
      const next = { ...p[key] };
      fields.forEach((f) => delete next[f]);
      return { ...p, [key]: next };
    });
  }

  function addRecipient() {
    const last = recipients[recipients.length - 1];
    const r = blankRecipient(last?.sendDate ?? GIFT_DATE_DEFAULT, last?.bars ?? 3);
    setRecipients((rs) => [...rs, r]);
    setActiveKey(r.key);
    requestAnimationFrame(() => document.getElementById(`${uid}-${r.key}-name`)?.focus());
  }

  function removeRecipient(key: number) {
    if (recipients.length === 1) {
      setRecipients([blankRecipient(recipients[0].sendDate, recipients[0].bars)]);
    } else {
      setRecipients((rs) => rs.filter((r) => r.key !== key));
    }
    setProblems((p) => {
      const next = { ...p };
      delete next[key];
      return next;
    });
  }

  function addFromPaste() {
    const fallback = recipients[0]?.sendDate ?? GIFT_DATE_DEFAULT;
    const { rows, skipped } = parseRecipientList(pasteText, fallback);
    const fresh = rows.map((row) => ({ ...blankRecipient(row.sendDate), name: row.name, email: row.email }));
    setRecipients((rs) => {
      const onlyBlank = rs.length === 1 && !rs[0].name && !rs[0].email && !rs[0].note;
      const kept = onlyBlank ? [] : rs;
      const merged = [...kept, ...fresh];
      return merged.length ? merged : [blankRecipient()];
    });
    const added = rows.length;
    setPasteMsg(
      `Added ${added} ${added === 1 ? "person" : "people"}.` +
        (skipped ? ` Skipped ${skipped} ${skipped === 1 ? "line" : "lines"} with no email.` : "")
    );
    if (added) setPasteText("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (!canAdd) return;

    let cartLines: CartLineInput[];
    if (mode === "me") {
      cartLines = [{ merchandiseId: tierFor(selfBars).variant!.id, quantity: 1 }];
    } else {
      const found = validateRecipients(recipients, today ?? societyToday());
      if (found.length) {
        const byKey: Problems = {};
        for (const pr of found) {
          const key = recipients[pr.index].key;
          byKey[key] = { ...byKey[key], [pr.field]: pr.message };
        }
        setProblems(byKey);
        setFeedback({
          ok: false,
          text: `Check ${found.length === 1 ? "the highlighted field" : `the ${found.length} highlighted fields`} before adding to cart.`,
        });
        const first = found[0];
        document.getElementById(`${uid}-${recipients[first.index].key}-${first.field}`)?.focus();
        return;
      }
      cartLines = recipients.map((r) => ({
        merchandiseId: tierFor(r.bars).variant!.id,
        quantity: 1,
        attributes: giftAttributes(r, from),
      }));
      if (meToo) cartLines.push({ merchandiseId: tierFor(meTooBars).variant!.id, quantity: 1 });
    }

    setAdding(true);
    const result = await addLines(cartLines);
    setAdding(false);
    if (!result.success) {
      setFeedback({ ok: false, text: result.error });
      return;
    }
    for (const l of lines) trackAddToCart(product, tierFor(l.bars).variant!, 1);
    if (mode === "gift") {
      const n = recipients.length;
      setFeedback({
        ok: true,
        text: `Added ${n} ${n === 1 ? "gift" : "gifts"}${meToo ? " plus one for you" : ""} to your cart.`,
      });
      setRecipients([blankRecipient(recipients[recipients.length - 1].sendDate)]);
      setMeToo(false);
      setProblems({});
    } else {
      setFeedback({ ok: true, text: "Added to your cart." });
    }
  }

  const active = recipients.find((r) => r.key === activeKey) ?? recipients[0];
  const activeIndex = recipients.indexOf(active);

  return (
    <section id={JOIN_ANCHOR} className="scroll-mt-24 px-fluid-md py-fluid-2xl">
      <span id={JOIN_GIFT_ANCHOR} className="block scroll-mt-24" aria-hidden="true" />
      <div className="mx-auto flex max-w-7xl flex-col gap-fluid-lg">
        <div className="flex flex-col gap-fluid-xs">
          <Preheader>Join or Gift</Preheader>
          <Headline as="h2" size="md">
            Pick Your Membership
          </Headline>
        </div>

        <div className="grid items-start gap-fluid-lg lg:grid-cols-2">
          <form onSubmit={handleSubmit} noValidate className="flex min-w-0 flex-col gap-7">
            {/* Step 1 */}
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 flex items-center gap-2.5">
                <StepNumber n={1} />
                <span className={LABEL}>Who&rsquo;s it for?</span>
              </legend>
              <div className="grid grid-cols-2 gap-2.5">
                {(
                  [
                    ["me", "Just me"],
                    ["gift", "Gifting"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center justify-center rounded-full border-2 border-tf-black/20 px-4 py-3.5 text-center font-sans text-sm font-black tracking-[0.075em] uppercase has-[:checked]:border-tf-black has-[:checked]:bg-tf-black has-[:checked]:text-tf-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tf-cinnamon has-[:focus-visible]:ring-offset-2"
                  >
                    <input
                      type="radio"
                      name={`${uid}-mode`}
                      value={value}
                      checked={mode === value}
                      onChange={() => setMode(value)}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {mode === "me" ? (
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 flex items-center gap-2.5">
                  <StepNumber n={2} />
                  <span className={LABEL}>Bars per month</span>
                </legend>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {tiers.map((tier, i) => (
                    <label
                      key={tier.bars}
                      className="relative flex cursor-pointer flex-col gap-1.5 rounded-2xl border-2 border-tf-black/20 bg-tf-white p-5 transition-shadow hover:border-tf-black has-[:checked]:border-tf-black has-[:checked]:shadow-[6px_6px_0_var(--tf-black)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tf-cinnamon has-[:focus-visible]:ring-offset-2"
                    >
                      <input
                        type="radio"
                        name={`${uid}-tier`}
                        value={tier.bars}
                        checked={selfBars === tier.bars}
                        onChange={() => setSelfBars(tier.bars)}
                        className="sr-only"
                      />
                      {i === tiers.length - 1 && (
                        <span className="absolute -top-3 right-3.5 rounded-full bg-tf-cinnamon-strong px-2.5 py-1 font-sans text-[0.65rem] font-black tracking-[0.075em] text-tf-white uppercase">
                          Best value
                        </span>
                      )}
                      <span className="font-display text-2xl leading-tight font-semibold">{tier.name}</span>
                      <span className="font-display text-4xl leading-none font-semibold tabular-nums">
                        {formatMoney(tier.price)}
                      </span>
                      <span className="text-sm text-tf-black/70 tabular-nums">
                        {tier.bars} bars a month · {tier.bars * 6} bars total
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <StepNumber n={2} />
                  <span className={LABEL}>Who are the lucky ones?</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${uid}-from`} className={LABEL}>
                    Signed from
                  </label>
                  <input
                    id={`${uid}-from`}
                    value={from}
                    maxLength={NAME_MAX}
                    autoComplete="name"
                    placeholder="Your name, as it should appear on the email"
                    onChange={(e) => setFrom(e.target.value)}
                    className={INPUT}
                  />
                </div>

                <ol className="flex flex-col gap-3.5">
                  {recipients.map((r, i) => (
                    <RecipientCard
                      key={r.key}
                      idPrefix={`${uid}-${r.key}`}
                      index={i}
                      count={recipients.length}
                      recipient={r}
                      tiers={tiers}
                      minDate={minDate}
                      problems={problems[r.key] ?? {}}
                      onFocus={() => setActiveKey(r.key)}
                      onChange={(patch) => updateRecipient(r.key, patch)}
                      onRemove={() => removeRecipient(r.key)}
                    />
                  ))}
                </ol>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  <Button type="button" variant="secondary" onClick={addRecipient}>
                    + Add a recipient
                  </Button>
                  <button
                    type="button"
                    aria-expanded={pasteOpen}
                    aria-controls={`${uid}-paste`}
                    onClick={() => {
                      setPasteOpen((o) => !o);
                      requestAnimationFrame(() => pasteRef.current?.focus());
                    }}
                    className="text-sm font-semibold underline underline-offset-4"
                  >
                    {pasteOpen ? "Hide the list box" : "Paste a list instead"}
                  </button>
                </div>

                {pasteOpen && (
                  <div
                    id={`${uid}-paste`}
                    className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-tf-black/25 p-5"
                  >
                    <label htmlFor={`${uid}-paste-text`} className={LABEL}>
                      One person per line: name, email, send date (optional)
                    </label>
                    <textarea
                      ref={pasteRef}
                      id={`${uid}-paste-text`}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      rows={5}
                      placeholder={"Linda Park, linda@example.com, 12/25\nMarcus Bell, marcus@example.com"}
                      className={INPUT}
                    />
                    <p className="text-sm text-tf-black/70">
                      Anyone without a date gets the first recipient&rsquo;s date. Box size starts at 3
                      bars; change it on each card.
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      <Button type="button" onClick={addFromPaste} disabled={!pasteText.trim()}>
                        Add these people
                      </Button>
                      <p role="status" className="text-sm">
                        {pasteMsg}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-base font-semibold">
                    <input
                      type="checkbox"
                      checked={meToo}
                      onChange={(e) => setMeToo(e.target.checked)}
                      className="h-[18px] w-[18px] accent-tf-black"
                    />
                    Add one for me too
                  </label>
                  <select
                    aria-label="Box size for your own membership"
                    value={meTooBars}
                    disabled={!meToo}
                    onChange={(e) => setMeTooBars(Number(e.target.value) as TierBars)}
                    className="rounded-lg border-[1.5px] border-tf-black/20 bg-tf-white px-3 py-2 disabled:opacity-50"
                  >
                    {tiers.map((t) => (
                      <option key={t.bars} value={t.bars}>
                        {t.bars} bars a month · {formatMoney(t.price)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="flex flex-col gap-3 border-t-2 border-tf-black pt-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-display text-3xl font-semibold tabular-nums">
                    {formatMoney({ amount: total.toFixed(2), currencyCode: currency })}
                  </p>
                  <p className="text-sm text-tf-black/70">
                    {lines.length} {lines.length === 1 ? "membership" : "memberships"}
                  </p>
                </div>
                <Button type="submit" disabled={!canAdd}>
                  {buttonLabel}
                </Button>
              </div>
              {phase !== "live" && (
                <a
                  href={`#${NOTIFY_ANCHOR}`}
                  className="self-start text-sm font-semibold underline underline-offset-4"
                >
                  {phase === "pre"
                    ? "Get an email when doors open \u2192"
                    : "Get an email when the next season opens \u2192"}
                </a>
              )}
              {mode === "gift" && (
                <ul className="flex flex-col gap-1 text-sm text-tf-black/70 tabular-nums">
                  {lines.map((l, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span className="min-w-0 break-words">
                        {l.label} · {tierFor(l.bars).name}
                        {l.date ? ` · emailed ${formatGiftDate(l.date)}` : ""}
                      </span>
                      <span>{formatMoney(tierFor(l.bars).price)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p
                role="status"
                className={
                  feedback
                    ? `rounded-xl px-4 py-3 text-sm font-semibold ${feedback.ok ? "bg-tf-juniper" : "bg-tf-rose"}`
                    : "sr-only"
                }
              >
                {feedback?.text ?? ""}
              </p>
            </div>
          </form>

          {/* Gift email preview */}
          <aside aria-label="Membership email preview" className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-28">
            <div className="rounded-3xl bg-tf-rose p-3.5">
              <div
                className="flex min-h-[320px] flex-col gap-3.5 rounded-lg bg-tf-white p-6 sm:p-8"
                style={{
                  border: "12px solid transparent",
                  borderImage:
                    "repeating-linear-gradient(90deg, var(--tf-black) 0 10px, var(--tf-white) 10px 20px) 12",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <Preheader size="sm">The Mischief Society</Preheader>
                  <EyesHatIcon className="h-auto w-11 text-tf-black" aria-hidden="true" />
                </div>
                {mode === "gift" ? (
                  <>
                    <p className="font-display text-3xl leading-tight font-semibold sm:text-4xl">
                      {active.name.trim() ? `${active.name.trim().split(/\s+/)[0]}, you’re in.` : "You’re in."}
                    </p>
                    <p className="font-display text-lg leading-snug break-words italic">
                      {active.note.trim() ||
                        "Six months of chocolate, your pick every month. Welcome to the Society."}
                    </p>
                    <p className="self-end font-display text-2xl">&ndash;{from.trim() || "You"}</p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-3xl leading-tight font-semibold sm:text-4xl">
                      Welcome to the Society.
                    </p>
                    <p className="font-display text-lg leading-snug italic">
                      Your membership is official. In January you&rsquo;ll pick your first bars.
                    </p>
                    <p className="self-end font-display text-2xl">&ndash;Tom</p>
                  </>
                )}
                <span className="self-start rounded-full bg-tf-black px-4 py-2 font-sans text-[0.7rem] font-black tracking-[0.075em] text-tf-white uppercase">
                  Watch for your pick-your-bars email in January
                </span>
                <dl className="mt-auto grid grid-cols-3 gap-2 border-t-[1.5px] border-tf-black/20 pt-3 text-xs">
                  <div>
                    <dt className="sr-only">Bars</dt>
                    <dd>
                      <b className="block font-display text-lg font-semibold tabular-nums">
                        {mode === "gift" ? active.bars : selfBars} bars
                      </b>
                      every month
                    </dd>
                  </div>
                  <div>
                    <dt className="sr-only">Boxes</dt>
                    <dd>
                      <b className="block font-display text-lg font-semibold">6 boxes</b>Jan &ndash; Jun
                    </dd>
                  </div>
                  <div>
                    <dt className="sr-only">Flavors</dt>
                    <dd>
                      <b className="block font-display text-lg font-semibold">Secret</b>flavors inside
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            <p className="text-center text-sm text-tf-black/70">
              {mode === "gift"
                ? `Gift ${activeIndex + 1} of ${recipients.length}: emailed to ${
                    active.email.trim() || "their inbox"
                  } on ${formatGiftDate(active.sendDate) || "the date you pick"}.`
                : "In January we’ll email you to pick your first bars."}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid h-7 w-7 flex-none place-items-center rounded-full bg-tf-black text-xs font-black text-tf-white"
    >
      {n}
    </span>
  );
}

function RecipientCard({
  idPrefix,
  index,
  count,
  recipient: r,
  tiers,
  minDate,
  problems,
  onFocus,
  onChange,
  onRemove,
}: {
  idPrefix: string;
  index: number;
  count: number;
  recipient: Recipient;
  tiers: PickerTier[];
  minDate: string;
  problems: Partial<Record<Field, string>>;
  onFocus: () => void;
  onChange: (patch: Partial<Recipient>) => void;
  onRemove: () => void;
}) {
  const field = (name: Field) => ({
    id: `${idPrefix}-${name}`,
    "aria-invalid": problems[name] ? true : undefined,
    "aria-describedby": problems[name] ? `${idPrefix}-${name}-error` : undefined,
  });
  const err = (name: Field) =>
    problems[name] ? (
      <p id={`${idPrefix}-${name}-error`} className={ERROR}>
        {problems[name]}
      </p>
    ) : null;

  return (
    <li
      onFocus={onFocus}
      className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-transparent bg-tf-rose/25 p-5 focus-within:border-tf-rose"
    >
      <div className="flex items-center justify-between gap-3">
        <p className={LABEL}>Gift {index + 1}</p>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm font-semibold underline underline-offset-4"
          aria-label={count === 1 ? `Clear gift ${index + 1}` : `Remove gift ${index + 1}`}
        >
          {count === 1 ? "Clear" : "Remove"}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-name`} className={LABEL}>
            Their name
          </label>
          <input
            {...field("name")}
            value={r.name}
            maxLength={NAME_MAX}
            autoComplete="off"
            placeholder="Linda Park"
            onChange={(e) => onChange({ name: e.target.value })}
            className={INPUT}
          />
          {err("name")}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-email`} className={LABEL}>
            Their email
          </label>
          <input
            {...field("email")}
            type="email"
            value={r.email}
            autoComplete="off"
            placeholder="linda@example.com"
            onChange={(e) => onChange({ email: e.target.value })}
            className={INPUT}
          />
          {err("email")}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-sendDate`} className={LABEL}>
            Email them on
          </label>
          <input
            {...field("sendDate")}
            type="date"
            value={r.sendDate}
            min={minDate}
            max={GIFT_DATE_MAX}
            onChange={(e) => onChange({ sendDate: e.target.value })}
            className={INPUT}
          />
          {err("sendDate")}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-bars`} className={LABEL}>
            Box size
          </label>
          <select
            id={`${idPrefix}-bars`}
            value={r.bars}
            onChange={(e) => onChange({ bars: Number(e.target.value) as TierBars })}
            className={INPUT}
          >
            {tiers.map((t) => (
              <option key={t.bars} value={t.bars}>
                {t.bars} bars a month · {formatMoney(t.price)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idPrefix}-note`} className={LABEL}>
          Note for them (optional)
        </label>
        <textarea
          {...field("note")}
          value={r.note}
          maxLength={GIFT_NOTE_MAX}
          rows={3}
          placeholder="Six months of chocolate, your pick every month."
          onChange={(e) => onChange({ note: e.target.value })}
          className={INPUT}
        />
        <p className="text-xs text-tf-black/60 tabular-nums">
          {r.note.length} / {GIFT_NOTE_MAX}
        </p>
        {err("note")}
      </div>
    </li>
  );
}
