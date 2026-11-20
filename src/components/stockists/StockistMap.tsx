"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Map as MapLibreMap, Marker, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Stockist } from "@/lib/stockists/types";
import { milesBetween } from "@/lib/stockists/distance";
import { StockistDetails } from "./StockistDetails";

/**
 * The map half of /find-us: MapLibre GL (open-source, no API key) over
 * OpenFreeMap's hosted OpenStreetMap tiles (free, no key, no usage cap).
 * Swap the basemap for any other MapLibre-compatible style (MapTiler,
 * Stadia, a self-hosted one…) by setting NEXT_PUBLIC_MAP_STYLE_URL —
 * nothing else here is provider-specific.
 *
 * Purely presentational: which store is selected and where the visitor
 * searched from live in StoreLocator, which also renders the same stores
 * as a plain list — so the page still does its job if WebGL or the tile
 * host is unavailable and this component can only show its fallback.
 */
const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/positron";

/** MapLibre touches `window` at import time, so it's loaded on demand in
 * the browser. v5 ships as a UMD bundle — depending on the bundler its
 * API lands on the namespace itself or on `.default`; accept either. */
async function loadMapLibre(): Promise<typeof import("maplibre-gl")> {
  const mod = await import("maplibre-gl");
  return (mod as unknown as { default?: typeof import("maplibre-gl") }).default ?? mod;
}

/** Lower 48, for the first paint before the pins are fitted. */
const USA_CENTER: [number, number] = [-96.5, 39];

/** After a search: frame the origin plus every shop this close… */
const NEARBY_MILES = 30;
/** …or, somewhere we're thin on the ground, at least this many. */
const MIN_FRAMED = 3;

const PIN_SVG =
  '<svg viewBox="0 0 28 38" width="28" height="38" aria-hidden="true" focusable="false">' +
  '<path d="M14 1C6.8 1 1 6.7 1 13.8c0 9.2 10.6 21 12.2 22.8a1.1 1.1 0 0 0 1.6 0C16.4 34.8 27 23 27 13.8 27 6.7 21.2 1 14 1Z" />' +
  '<circle cx="14" cy="14" r="4.6" /></svg>';

export interface StockistMapProps {
  stockists: Stockist[];
  origin: { lat: number; lng: number } | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  prefersReducedMotion: boolean;
}

export default function StockistMap({
  stockists,
  origin,
  selectedId,
  onSelect,
  prefersReducedMotion,
}: StockistMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef(new Map<string, Marker>());
  const popupRef = useRef<Popup | null>(null);
  const originMarkerRef = useRef<Marker | null>(null);
  // The popup's content lives in a detached node that MapLibre owns the
  // placement of and React (via the portal below) owns the contents of.
  const [popupNode] = useState(() =>
    typeof document === "undefined" ? null : document.createElement("div")
  );
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Latest values for callbacks registered once at map creation.
  const onSelectRef = useRef(onSelect);
  const animateRef = useRef(!prefersReducedMotion);
  useEffect(() => {
    onSelectRef.current = onSelect;
    animateRef.current = !prefersReducedMotion;
  }, [onSelect, prefersReducedMotion]);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | undefined;

    (async () => {
      try {
        const maplibre = await loadMapLibre();
        if (cancelled || !containerRef.current) return;

        map = new maplibre.Map({
          container: containerRef.current,
          style: MAP_STYLE_URL,
          center: USA_CENTER,
          zoom: 3,
          // Don't trap page scroll: wheel/one-finger drags scroll the
          // page, ctrl/⌘+wheel or two fingers move the map (MapLibre
          // shows its own hint the first time).
          cooperativeGestures: true,
          attributionControl: { compact: true },
        });
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");

        popupRef.current = new maplibre.Popup({ offset: 36, maxWidth: "280px", focusAfterOpen: false });
        popupRef.current.on("close", () => onSelectRef.current(null));

        mapRef.current = map;
        // Pins are DOM markers — they don't need the basemap style, so
        // show them as soon as the map object exists rather than waiting
        // on tiles.
        setReady(true);
      } catch (error) {
        // No WebGL (old device, locked-down browser) — the list still works.
        console.warn("[find-us] Map failed to initialise", error);
        if (!cancelled) setFailed(true);
      }
    })();

    const markers = markersRef.current;
    return () => {
      cancelled = true;
      markers.clear();
      popupRef.current = null;
      originMarkerRef.current = null;
      mapRef.current = null;
      map?.remove();
    };
  }, []);

  // One pin per stockist.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    let cancelled = false;
    const markers = markersRef.current;

    (async () => {
      const { Marker } = await loadMapLibre();
      if (cancelled) return;

      markers.forEach((marker) => marker.remove());
      markers.clear();

      for (const stockist of stockists) {
        const pin = document.createElement("button");
        pin.type = "button";
        pin.className = "tf-map-pin";
        pin.innerHTML = PIN_SVG;
        pin.setAttribute("aria-label", `${stockist.name}, ${stockist.city}, ${stockist.state}`);
        pin.addEventListener("click", (event) => {
          // Otherwise the map's own click handling closes the popup
          // this click is about to open.
          event.stopPropagation();
          onSelectRef.current(stockist.id);
        });

        markers.set(
          stockist.id,
          new Marker({ element: pin, anchor: "bottom" })
            .setLngLat([stockist.lng, stockist.lat])
            .addTo(map)
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, stockists]);

  // Frame the view: everything by default, the neighbourhood after a search.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || stockists.length === 0) return;
    let cancelled = false;

    (async () => {
      const { LngLatBounds } = await loadMapLibre();
      if (cancelled) return;

      const bounds = new LngLatBounds();
      if (origin) {
        const byDistance = stockists
          .map((stockist) => ({ stockist, miles: milesBetween(origin, stockist) }))
          .sort((a, b) => a.miles - b.miles);
        const framed = byDistance.filter(
          ({ miles }, index) => miles <= NEARBY_MILES || index < MIN_FRAMED
        );
        bounds.extend([origin.lng, origin.lat]);
        framed.forEach(({ stockist }) => bounds.extend([stockist.lng, stockist.lat]));
      } else {
        stockists.forEach((stockist) => bounds.extend([stockist.lng, stockist.lat]));
      }

      map.fitBounds(bounds, {
        padding: { top: 70, bottom: 40, left: 50, right: 50 },
        maxZoom: 13,
        animate: animateRef.current,
        duration: 900,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, stockists, origin]);

  // "You searched here" dot.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    let cancelled = false;

    originMarkerRef.current?.remove();
    originMarkerRef.current = null;
    if (!origin) return;

    (async () => {
      const { Marker } = await loadMapLibre();
      if (cancelled) return;
      const dot = document.createElement("div");
      dot.className = "tf-map-origin";
      dot.setAttribute("role", "img");
      dot.setAttribute("aria-label", "Your search location");
      originMarkerRef.current = new Marker({ element: dot })
        .setLngLat([origin.lng, origin.lat])
        .addTo(map);
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, origin]);

  // Reflect the selection: highlight its pin, open the popup, bring it
  // into view if it's off-screen or we're too zoomed out to tell pins apart.
  const selected = stockists.find((s) => s.id === selectedId) ?? null;
  useEffect(() => {
    const map = mapRef.current;
    const popup = popupRef.current;
    if (!ready || !map || !popup || !popupNode) return;

    markersRef.current.forEach((marker, id) => {
      const isSelected = id === selected?.id;
      marker.getElement().classList.toggle("is-selected", isSelected);
      marker.getElement().style.zIndex = isSelected ? "2" : "";
    });

    if (!selected) {
      if (popup.isOpen()) popup.remove();
      return;
    }

    const position: [number, number] = [selected.lng, selected.lat];
    popup.setLngLat(position);
    if (!popup.isOpen()) popup.setDOMContent(popupNode).addTo(map);

    const zoom = Math.max(map.getZoom(), 11);
    if (zoom !== map.getZoom() || !map.getBounds().contains(position)) {
      // Leave room above the pin for the popup.
      const options = { center: position, zoom, offset: [0, 60] as [number, number] };
      if (animateRef.current) map.easeTo({ ...options, duration: 700 });
      else map.jumpTo(options);
    }
  }, [ready, selected, popupNode]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[4px] border-[1.5px] border-tf-black bg-[#f2f3f0]">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="region"
        aria-label="Map of shops that carry Tom Foolery Chocolate"
      />

      {failed && (
        <p className="absolute inset-0 flex items-center justify-center px-fluid-md text-center font-sans text-sm text-tf-black/70">
          The map couldn&rsquo;t load on this device &mdash; every shop is still in the list.
        </p>
      )}

      {popupNode &&
        selected &&
        createPortal(
          <div className="pr-4">
            <p className="font-display text-lg font-semibold leading-tight text-tf-black">
              {selected.name}
            </p>
            <div className="mt-1">
              <StockistDetails stockist={selected} />
            </div>
          </div>,
          popupNode
        )}
    </div>
  );
}
