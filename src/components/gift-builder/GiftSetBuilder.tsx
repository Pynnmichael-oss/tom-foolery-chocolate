"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useCart } from "@/components/commerce/CartProvider";
import { trackAddToCart } from "@/lib/analytics/ga";
import { formatMoney } from "@/lib/shopify/format";
import { sameAttributes } from "@/lib/shopify/cart-attributes";
import type { GiftBuilderConfig } from "@/lib/gift-builder/queries";
import {
  buildCartLine,
  findVariant,
  flavorLabel,
  slotCount,
} from "@/lib/gift-builder/cart-line";

/**
 * Build-your-own gift set: box size → flavors (bar sets only) → occasion
 * + band → wrap + note. Each finished set goes into the cart as ONE line
 * on the matching size/wrap variant, with the choices as line item
 * attributes (see lib/gift-builder/cart-line.ts for the exact format the
 * packing team and ShipStation rely on).
 *
 * After a successful add, the slots and note reset so the shopper can
 * build another set (one per recipient) — size, band and wrap stay, since
 * those are usually the same across a batch of gifts.
 */

// Shared look for every selectable card/pill — selected state is a solid
// tf-black ring, matching the site's variant pills.
const SELECTABLE =
  "cursor-pointer rounded-2xl border-2 border-tf-black/15 bg-tf-white text-left transition-[border-color,transform] duration-150 " +
  "hover:border-tf-black/40 motion-safe:active:scale-[0.98] " +
  "aria-pressed:border-tf-black aria-pressed:shadow-[inset_0_0_0_1px_var(--tf-black)] " +
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-tf-black/15 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon focus-visible:ring-offset-2";

const CHIP =
  "cursor-pointer rounded-full border-2 border-tf-black/20 px-4 py-1.5 font-sans text-sm font-semibold transition-colors " +
  "hover:border-tf-black aria-pressed:border-tf-black aria-pressed:bg-tf-black aria-pressed:text-tf-white " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon focus-visible:ring-offset-2";

function StepLegend({ n, children, aside }: { n: number; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <legend className="mb-fluid-sm flex w-full items-center gap-3 p-0">
      <span
        aria-hidden="true"
        className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-full bg-tf-black font-sans text-sm font-black text-tf-white"
      >
        {n}
      </span>
      <span className="font-display text-xl font-semibold leading-tight">{children}</span>
      {aside ? <span className="ml-auto font-sans text-sm text-fg/70">{aside}</span> : null}
    </legend>
  );
}

export function GiftSetBuilder({
  config,
  wrapPriceLabel = "+$1",
}: {
  config: GiftBuilderConfig;
  wrapPriceLabel?: string;
}) {
  const { addItem } = useCart();
  const hasFlavors = config.flavors.length > 0;
  const hasBands = config.bands.length > 0;

  const [size, setSize] = useState(config.sizes[0] ?? "");
  const [slots, setSlots] = useState<(string | null)[]>(() =>
    Array(hasFlavors ? slotCount(config.sizes[0] ?? "") : 0).fill(null)
  );
  const [wrap, setWrap] = useState(false);
  const [category, setCategory] = useState<string | null>(
    config.bandCategories.length === 1 ? config.bandCategories[0] : null
  );
  const [bandId, setBandId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  const variant = findVariant(config, size, wrap);
  const filled = slots.filter(Boolean).length;
  const remaining = slots.length - filled;
  const band = config.bands.find((b) => b.id === bandId) ?? null;
  const bandsInCategory = config.bands.filter((b) => b.category === category);
  const flavorById = useMemo(() => new Map(config.flavors.map((f) => [f.id, f])), [config.flavors]);
  const countFor = (id: string) => slots.filter((s) => s === id).length;

  function changeSize(next: string) {
    setSize(next);
    if (hasFlavors) {
      const n = slotCount(next);
      // Keep picks that still fit in the new box.
      setSlots((prev) => [...prev.slice(0, n), ...Array(Math.max(0, n - prev.length)).fill(null)]);
    }
    setError(null);
  }

  function addFlavor(id: string) {
    setSlots((prev) => {
      const i = prev.indexOf(null);
      if (i === -1) return prev;
      const next = [...prev];
      next[i] = id;
      return next;
    });
    setError(null);
  }

  function removeSlot(i: number) {
    setSlots((prev) => [...prev.filter((_, j) => j !== i), null]);
  }

  /** Fills only the empty slots (picks the shopper already made are
   * kept), each with whichever flavor is least represented so far — so
   * two Coffee & Cookies + "mix" adds a different flavor, not a third. */
  function fillWithMix() {
    setSlots((prev) => {
      const counts = new Map(config.flavors.map((f) => [f.id, 0]));
      for (const id of prev) if (id && counts.has(id)) counts.set(id, counts.get(id)! + 1);
      return prev.map((id) => {
        if (id) return id;
        const pick = config.flavors.reduce((best, f) => (counts.get(f.id)! < counts.get(best.id)! ? f : best));
        counts.set(pick.id, counts.get(pick.id)! + 1);
        return pick.id;
      });
    });
    setError(null);
  }

  function pickCategory(c: string) {
    setCategory(c);
    // Clear the band if it isn't in the newly picked occasion.
    if (band && band.category !== c) setBandId(null);
    setError(null);
  }

  async function handleAdd() {
    const result = buildCartLine(config, { size, wrap, slots, bandId, note });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAdding(true);
    setError(null);
    const productVariant = { ...result.line.variant, sellingPlanIds: [] };
    const cartResult = await addItem(
      productVariant,
      {
        title: config.title,
        handle: config.handle,
        images: config.image
          ? [{ url: config.image.url, altText: config.image.altText }]
          : [],
      },
      1,
      undefined,
      result.line.attributes
    );
    setAdding(false);
    if (!cartResult.success) {
      setError(cartResult.error);
      return;
    }
    // Shopify reports an out-of-stock variant as a *warning*, not a
    // userError — the add "succeeds" but the line comes back at quantity
    // 0. Check the real cart rather than trusting success alone.
    const added = cartResult.cart.lines.some(
      (l) =>
        l.merchandiseId === productVariant.id &&
        l.quantity > 0 &&
        sameAttributes(l.attributes, result.line.attributes)
    );
    if (!added) {
      setError("Sorry — that box can't be ordered right now. Please try another size or check back soon.");
      return;
    }
    trackAddToCart({ title: config.title }, productVariant, 1);
    setSlots(Array(slots.length).fill(null));
    setNote("");
    setAddedCount((n) => n + 1);
  }

  const blockedLabel =
    hasFlavors && remaining > 0
      ? `Pick ${remaining} more`
      : hasBands && !band
        ? "Choose a band"
        : null;

  let step = 0;

  return (
    <section aria-label={config.title} className="flex w-full flex-col gap-fluid-lg">
      {/* Step: size */}
      <fieldset className="m-0 border-0 p-0">
        <StepLegend n={++step}>Choose your box</StepLegend>
        <div className="flex flex-wrap gap-3">
          {config.sizes.map((s) => {
            const v = findVariant(config, s, false);
            return (
              <button
                key={s}
                type="button"
                className={`${SELECTABLE} grid min-w-36 gap-0.5 px-5 py-4`}
                aria-pressed={s === size}
                onClick={() => changeSize(s)}
                disabled={!v?.availableForSale}
              >
                <span className="font-sans font-black">{s}</span>
                <span className="font-sans text-sm text-fg/70">
                  {v ? (v.availableForSale ? formatMoney(v.price) : "Sold out") : "Unavailable"}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Step: flavors (bar sets only) */}
      {hasFlavors ? (
        <fieldset className="m-0 border-0 p-0">
          <StepLegend n={++step} aside={`${filled} of ${slots.length} picked`}>
            Fill it up
          </StepLegend>

          <ol aria-label="Your box" className="mb-fluid-sm grid grid-cols-3 gap-2 sm:grid-cols-6">
            {slots.map((id, i) => {
              const f = id ? flavorById.get(id) : null;
              return (
                <li
                  key={i}
                  className={`relative aspect-square overflow-hidden rounded-2xl border-2 ${
                    f ? "border-tf-black" : "border-dashed border-tf-black/25"
                  }`}
                >
                  {f ? (
                    <button
                      type="button"
                      onClick={() => removeSlot(i)}
                      aria-label={`Remove ${flavorLabel(f.title)} from bar ${i + 1}`}
                      className="group grid h-full w-full cursor-pointer place-items-center gap-1 p-1.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tf-cinnamon"
                    >
                      {f.featuredImage ? (
                        <span className="relative h-3/5 w-3/5 overflow-hidden rounded-lg">
                          <Image src={f.featuredImage.url} alt="" fill sizes="80px" className="object-cover" />
                        </span>
                      ) : null}
                      <span className="font-sans text-xs font-semibold leading-tight">{flavorLabel(f.title)}</span>
                      <span
                        aria-hidden="true"
                        className="absolute right-1.5 top-0.5 font-sans text-base text-fg/50 group-hover:text-tf-cinnamon"
                      >
                        ×
                      </span>
                    </button>
                  ) : (
                    <span className="grid h-full place-items-center font-sans text-xs text-fg/50">Bar {i + 1}</span>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {config.flavors.map((f) => {
              const count = countFor(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`${SELECTABLE} grid gap-1.5 p-3`}
                  onClick={() => addFlavor(f.id)}
                  disabled={remaining === 0}
                  aria-label={`Add ${flavorLabel(f.title)}${count ? ` (${count} in box)` : ""}`}
                >
                  {f.featuredImage ? (
                    <span className="relative aspect-square w-full overflow-hidden rounded-xl bg-tf-black/5">
                      <Image
                        src={f.featuredImage.url}
                        alt={f.featuredImage.altText ?? f.title}
                        fill
                        sizes="(min-width: 640px) 220px, 45vw"
                        className="object-cover"
                      />
                    </span>
                  ) : null}
                  <span className="font-sans font-black leading-tight">{flavorLabel(f.title)}</span>
                  <span className="font-sans text-sm text-fg/70">{count > 0 ? `In box: ${count}` : "Add"}</span>
                </button>
              );
            })}
          </div>
          {remaining > 0 ? (
            <button
              type="button"
              onClick={fillWithMix}
              className="mt-fluid-sm cursor-pointer font-sans text-sm font-semibold underline underline-offset-4 hover:text-tf-cinnamon-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon"
            >
              Can&rsquo;t decide? Fill it with a mix
            </button>
          ) : null}
        </fieldset>
      ) : null}

      {/* Step: occasion, then band */}
      {hasBands ? (
        <fieldset className="m-0 border-0 p-0">
          <StepLegend n={++step}>Pick a band</StepLegend>

          {config.bandCategories.length > 1 ? (
            <div className="mb-fluid-sm flex flex-col gap-2">
              <span className="font-sans text-sm font-semibold">What&rsquo;s the occasion?</span>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Occasion">
                {config.bandCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={c === category}
                    className={CHIP}
                    onClick={() => pickCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {category ? (
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              role="group"
              aria-label={`${category} bands`}
            >
              {bandsInCategory.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={b.id === bandId}
                  className={`${SELECTABLE} grid gap-2 p-2.5`}
                  onClick={() => {
                    setBandId(b.id);
                    setError(null);
                  }}
                >
                  <span className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-xl bg-tf-black/5">
                    {b.image ? (
                      <Image
                        src={b.image.url}
                        alt={b.image.altText ?? `${b.name} band`}
                        fill
                        sizes="(min-width: 640px) 220px, 45vw"
                        className="object-cover"
                      />
                    ) : (
                      <span aria-hidden="true" className="px-2 text-center font-sans text-xs text-fg/60">
                        {b.name}
                      </span>
                    )}
                  </span>
                  <span className="font-sans text-sm font-black leading-tight">{b.name}</span>
                </button>
              ))}
            </div>
          ) : null}
        </fieldset>
      ) : null}

      {/* Step: finishing touches */}
      <fieldset className="m-0 flex flex-col gap-fluid-sm border-0 p-0">
        <StepLegend n={++step}>Finishing touches</StepLegend>

        <label className="flex cursor-pointer items-center gap-3 font-sans font-semibold">
          <input
            type="checkbox"
            checked={wrap}
            onChange={(e) => {
              setWrap(e.target.checked);
              setError(null);
            }}
            className="h-5 w-5 accent-tf-black"
          />
          <span>Gift wrap it ({wrapPriceLabel})</span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-sans text-sm font-semibold">
            Gift note <span className="font-normal text-fg/60">(optional)</span>
          </span>
          <textarea
            value={note}
            maxLength={config.noteMaxLength}
            rows={3}
            placeholder="Happy holidays! Save me a square."
            onChange={(e) => setNote(e.target.value)}
            aria-describedby="gift-note-count"
            className="resize-y rounded-2xl border-2 border-tf-black/15 bg-tf-white px-4 py-3 font-sans text-base focus:border-tf-black focus:outline-none"
          />
          <span id="gift-note-count" className="self-end font-sans text-xs text-fg/60">
            {note.length}/{config.noteMaxLength}
          </span>
        </label>
      </fieldset>

      {/* Sticky summary + add */}
      <div className="sticky bottom-3 z-10 flex flex-col gap-2 rounded-2xl border-2 border-tf-black bg-tf-white px-5 py-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-sans font-black leading-tight">
              {size}
              {wrap ? " · Gift wrapped" : ""}
            </p>
            <p className="truncate font-sans text-sm text-fg/70">
              {band ? `Band: ${band.name}` : hasBands ? "No band yet" : config.title}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !variant?.availableForSale || blockedLabel !== null}
            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-tf-cinnamon-strong px-6 py-3 font-sans text-[length:var(--fs-preheader)] font-black uppercase tracking-[0.075em] text-tf-white transition-transform hover:bg-tf-cinnamon-strong/90 motion-safe:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon focus-visible:ring-offset-2"
          >
            {adding
              ? "Adding…"
              : (blockedLabel ?? `Add to cart${variant ? ` · ${formatMoney(variant.price)}` : ""}`)}
          </button>
        </div>
        <p aria-live="polite" className="font-sans text-sm empty:hidden">
          {error ? (
            <span role="alert" className="text-tf-cinnamon-strong">
              {error}
            </span>
          ) : addedCount > 0 ? (
            `Added! ${addedCount > 1 ? `${addedCount} sets so far. ` : ""}Build another for someone else, or check out from your cart.`
          ) : null}
        </p>
      </div>
    </section>
  );
}
