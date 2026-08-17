"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BrandVideo } from "@/components/media/BrandVideo";
import { useHoverCapableDevice } from "@/lib/hooks/useHoverCapableDevice";
import { formatMoney } from "@/lib/shopify/format";
import type { Product } from "@/lib/shopify/types";

export interface ProductCardProps {
  product: Product;
  className?: string;
  /** Base filename (no extension) under `public/video/` — e.g. prep or
   * pour footage. Optional; when set, hovering the card on a hover-capable
   * pointer device (mouse/trackpad, never touch — see
   * `useHoverCapableDevice`) crossfades from the static product photo to a
   * looping `BrandVideo`, and resets (unmounts, so it plays from frame one
   * next time) on mouse leave. Touch devices always just see the image. */
  hoverVideo?: string;
}

/** Photography-forward product card. Whole card is the link; the only
 * motion is a subtle, motion-safe tilt/scale on the image on hover, plus
 * an optional hover-video crossfade (see `hoverVideo`). */
export function ProductCard({ product, className = "", hoverVideo }: ProductCardProps) {
  const image = product.images[0];
  const { min, max } = product.priceRange;
  const price = min.amount === max.amount ? formatMoney(min) : `From ${formatMoney(min)}`;

  const isHoverCapable = useHoverCapableDevice();
  // `isHovering` drives opacity (the crossfade); `showVideoLayer` gates
  // whether BrandVideo is mounted at all. They're deliberately separate —
  // dropping straight to unmounted on mouse-leave would cut the fade-out
  // off mid-transition, so the video layer only unmounts once its own
  // opacity transition finishes (see onTransitionEnd below), which is also
  // what makes the next hover "reset": a fresh mount starts the clip over.
  const [isHovering, setIsHovering] = useState(false);
  const [showVideoLayer, setShowVideoLayer] = useState(false);
  // Fallback for the unmount-on-leave below: `transitionend` normally does
  // it, but browsers can skip that event in edge cases (element removed
  // mid-transition, tab backgrounded mid-fade) — a timer matching the
  // transition duration (plus a buffer) guarantees the reset still happens.
  const leaveTimeoutRef = useRef<number | null>(null);

  const canHoverVideo = Boolean(hoverVideo) && isHoverCapable;

  function clearLeaveTimeout() {
    if (leaveTimeoutRef.current !== null) {
      window.clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }

  useEffect(() => clearLeaveTimeout, []);

  function handleMouseEnter() {
    if (!canHoverVideo) return;
    clearLeaveTimeout();
    setShowVideoLayer(true);
    // Mount with opacity still 0, then flip on the next frame so the
    // opacity transition actually has something to animate from — mounting
    // and setting opacity-100 in the same tick can skip straight to the
    // end state depending on paint timing.
    requestAnimationFrame(() => setIsHovering(true));
  }

  function handleMouseLeave() {
    setIsHovering(false);
    // duration-500 above + a small buffer.
    leaveTimeoutRef.current = window.setTimeout(() => {
      setShowVideoLayer(false);
      leaveTimeoutRef.current = null;
    }, 600);
  }

  function handleVideoLayerTransitionEnd() {
    clearLeaveTimeout();
    if (!isHovering) setShowVideoLayer(false);
  }

  return (
    <Link
      href={`/shop/${product.handle}`}
      className={`group block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-tf-black/5">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.title}
            width={image.width ?? 800}
            height={image.height ?? 800}
            className="h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.06] motion-safe:group-hover:-rotate-1"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-tf-juniper text-tf-black">
            <span className="font-sans text-sm uppercase tracking-widest">No image</span>
          </div>
        )}

        {isHoverCapable && hoverVideo && showVideoLayer && (
          <div
            onTransitionEnd={handleVideoLayerTransitionEnd}
            className={`absolute inset-0 motion-safe:transition-opacity motion-safe:duration-500 motion-safe:ease-out motion-reduce:transition-none ${
              isHovering ? "opacity-100" : "opacity-0"
            }`}
          >
            <BrandVideo src={hoverVideo} poster={image?.url ?? ""} className="h-full w-full" />
          </div>
        )}
      </div>

      <h2 className="mt-fluid-sm font-display text-lg leading-tight text-fg sm:text-xl">
        {product.title}
      </h2>
      <p className="font-sans text-fg/70">{price}</p>
    </Link>
  );
}
