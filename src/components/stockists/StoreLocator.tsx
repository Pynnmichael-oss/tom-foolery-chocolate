"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useMediaPreferences } from "@/lib/hooks/useMediaPreferences";
import type { Stockist } from "@/lib/stockists/types";
import { formatMiles, milesBetween } from "@/lib/stockists/distance";
import { StockistDetails } from "./StockistDetails";

// MapLibre is ~250 kB gzipped and needs `window` — load it only in the
// browser, and only on this route, after the list is already on screen.
const StockistMap = dynamic(() => import("./StockistMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-[4px] border-[1.5px] border-tf-black bg-[#f2f3f0]" />
  ),
});

/** Past this, "nearest" isn't really "near" — say so, and point at /shop. */
const FAR_MILES = 100;

interface Origin {
  lat: number;
  lng: number;
  /** How the list heading refers to it: a ZIP, or "you". */
  label: string;
}

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

const FIELD_CLASS =
  "w-full rounded-[4px] border-[1.5px] border-tf-black bg-tf-white px-fluid-sm py-fluid-xs font-sans text-tf-black placeholder:text-tf-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon";

const TEXT_BUTTON_CLASS =
  "font-sans text-sm font-black uppercase tracking-[0.075em] text-tf-black underline decoration-tf-cinnamon decoration-2 underline-offset-4 hover:text-tf-cinnamon-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon disabled:opacity-50";

/**
 * /find-us: ZIP search + results list + map. The stockists arrive from
 * the server already filtered and located (src/lib/stockists); this
 * only sorts them by distance from wherever the visitor points it.
 *
 * The list is the source of truth and is fully usable on its own — the
 * map is an enhancement on top (see StockistMap).
 */
export function StoreLocator({ stockists }: { stockists: Stockist[] }) {
  const { prefersReducedMotion } = useMediaPreferences();
  const [zip, setZip] = useState("");
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());

  const results = useMemo(() => {
    if (!origin) return stockists.map((stockist) => ({ stockist, miles: null as number | null }));
    return stockists
      .map((stockist) => ({ stockist, miles: milesBetween(origin, stockist) as number | null }))
      .sort((a, b) => (a.miles ?? 0) - (b.miles ?? 0));
  }, [stockists, origin]);

  const nearestMiles = origin ? (results[0]?.miles ?? null) : null;
  const nothingNearby = nearestMiles !== null && nearestMiles > FAR_MILES;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = zip.trim();
    if (!/^\d{5}$/.test(value)) {
      setSearch({ status: "error", message: "Enter a 5-digit ZIP code." });
      return;
    }

    setSearch({ status: "loading" });
    try {
      const response = await fetch(`/api/zip/${value}`);
      if (response.status === 404) {
        setSearch({ status: "error", message: `We couldn't find ZIP code ${value}. Double-check it?` });
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const point = (await response.json()) as { lat: number; lng: number };
      setOrigin({ lat: point.lat, lng: point.lng, label: value });
      setSelectedId(null);
      setSearch({ status: "idle" });
    } catch {
      setSearch({ status: "error", message: "Something went wrong looking that up. Try again?" });
    }
  }

  function handleUseLocation() {
    if (!("geolocation" in navigator)) {
      setSearch({ status: "error", message: "Your browser can't share a location. Try a ZIP code instead." });
      return;
    }
    setSearch({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setOrigin({ lat: coords.latitude, lng: coords.longitude, label: "you" });
        setZip("");
        setSelectedId(null);
        setSearch({ status: "idle" });
      },
      () =>
        setSearch({
          status: "error",
          message: "We couldn't get your location. Try a ZIP code instead.",
        }),
      { maximumAge: 5 * 60 * 1000, timeout: 10_000 }
    );
  }

  function handleReset() {
    setOrigin(null);
    setZip("");
    setSelectedId(null);
    setSearch({ status: "idle" });
  }

  const handleSelect = useCallback((id: string | null) => setSelectedId(id), []);

  // A pin was picked on the map → bring its row into view, but only in
  // the side-by-side layout; stacked (mobile), that would scroll the map
  // the visitor just tapped right off the screen.
  useEffect(() => {
    if (!selectedId || !window.matchMedia("(min-width: 1024px)").matches) return;
    rowRefs.current.get(selectedId)?.scrollIntoView({
      block: "nearest",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [selectedId, prefersReducedMotion]);

  const heading = origin
    ? origin.label === "you"
      ? "Closest to You"
      : `Closest to ${origin.label}`
    : `${stockists.length} Shops & Counting`;

  return (
    <div className="flex flex-col gap-fluid-md">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto flex w-full max-w-xl flex-col gap-fluid-xs"
      >
        <label
          htmlFor="tf-find-us-zip"
          className="font-sans text-sm font-black uppercase tracking-[0.075em] text-fg/70"
        >
          Search by ZIP Code
        </label>
        <div className="flex gap-fluid-xs">
          <input
            id="tf-find-us-zip"
            name="zip"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            placeholder="60614"
            value={zip}
            onChange={(event) => setZip(event.target.value.replace(/\D/g, "").slice(0, 5))}
            aria-invalid={search.status === "error"}
            aria-describedby={search.status === "error" ? "tf-find-us-error" : undefined}
            className={FIELD_CLASS}
          />
          <Button type="submit" disabled={search.status === "loading"} className="shrink-0">
            {search.status === "loading" ? "Finding…" : "Find Shops"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-fluid-md gap-y-1">
          <button type="button" onClick={handleUseLocation} className={TEXT_BUTTON_CLASS}>
            Use My Location
          </button>
          {origin && (
            <button type="button" onClick={handleReset} className={TEXT_BUTTON_CLASS}>
              Show All Shops
            </button>
          )}
        </div>

        {search.status === "error" && (
          <p id="tf-find-us-error" role="alert" className="font-sans text-sm text-tf-cinnamon-strong">
            {search.message}
          </p>
        )}
      </form>

      <div className="grid gap-fluid-md lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
        {/* Map first in the DOM on small screens (it's the visual
            answer to the search), second column on large ones. */}
        <div className="h-[60vh] min-h-[320px] lg:sticky lg:top-24 lg:order-2 lg:h-[calc(100dvh-8rem)]">
          <StockistMap
            stockists={stockists}
            origin={origin}
            selectedId={selectedId}
            onSelect={handleSelect}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>

        <section aria-labelledby="tf-find-us-results" className="lg:order-1">
          <h2
            id="tf-find-us-results"
            aria-live="polite"
            className="font-display text-2xl font-semibold text-fg"
          >
            {heading}
          </h2>

          {nothingNearby && (
            <p className="mt-fluid-xs rounded-[4px] bg-tf-turmeric/30 px-fluid-sm py-fluid-xs font-sans text-sm text-tf-black">
              No shops within {FAR_MILES} miles yet &mdash; the closest are below. In the
              meantime,{" "}
              <Link href="/shop" className="font-black underline decoration-2 underline-offset-2">
                we ship nationwide
              </Link>
              .
            </p>
          )}

          <ol className="mt-fluid-sm border-t-[1.5px] border-tf-black">
            {results.map(({ stockist, miles }) => {
              const isSelected = stockist.id === selectedId;
              return (
                <li
                  key={stockist.id}
                  ref={(node) => {
                    if (node) rowRefs.current.set(stockist.id, node);
                    else rowRefs.current.delete(stockist.id);
                  }}
                  className={`scroll-mt-28 border-b border-tf-black/15 px-fluid-xs py-fluid-sm transition-colors ${
                    isSelected ? "bg-tf-juniper/35" : ""
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-fluid-sm">
                    <h3 className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedId(stockist.id)}
                        aria-pressed={isSelected}
                        className="text-left font-display text-xl font-semibold leading-tight text-tf-black hover:text-tf-cinnamon-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon"
                      >
                        {stockist.name}
                        <span className="sr-only"> — show on map</span>
                      </button>
                    </h3>
                    {miles !== null && (
                      <span className="shrink-0 font-sans text-xs font-black uppercase tracking-[0.075em] text-tf-black/70">
                        {formatMiles(miles)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1">
                    <StockistDetails stockist={stockist} />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
