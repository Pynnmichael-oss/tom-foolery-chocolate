"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useMediaPreferences } from "@/lib/hooks/useMediaPreferences";

export interface BrandVideoProps {
  /** Base filename (no extension) under `public/video/` — resolves to
   * `/video/{src}.webm` (tried first) and `/video/{src}.mp4` (fallback)
   * `<source>` elements. Encode both with `scripts/encode-video.sh`. */
  src: string;
  /** Poster image path (e.g. "/video/hero-placeholder-poster.jpg"). Always
   * rendered — as the native `<video poster>` frame when motion is
   * allowed, or as the actual visible image (via `next/image`) when it
   * isn't. Reserves the box's visual weight either way, so there's nothing
   * to shift once a real video decides to play. */
  poster: string;
  /** Accessible text for the poster's `next/image` `alt`. Leave the default
   * empty string for purely decorative brand-motion clips — the `<video>`
   * itself always stays `aria-hidden` regardless, since nothing here is
   * ever the only way to get at information on the page. */
  alt?: string;
  /** CSS `aspect-ratio` for this component's own box (e.g. `"16 / 9"`).
   * Omit when nesting inside a wrapper that already reserves the aspect
   * ratio (e.g. StorySection's `media` slot, or ProductCard's hover
   * layer) — pass `className="h-full w-full"` instead so the video fills
   * its parent rather than fighting it for size. */
  aspectRatio?: string;
  className?: string;
  /** Above-the-fold usage (e.g. Hero's background): load immediately
   * (`preload="auto"`, autoplay without waiting to scroll into view)
   * instead of the default lazy gate. Still yields to reduced-motion /
   * data-saver — priority only affects *when* it loads, never *whether*. */
  priority?: boolean;
}

const LAZY_ROOT_MARGIN = "200px 0px";

/**
 * Performance-safe wrapper around brand video clips. Renders nothing at all
 * (not even a `<source>`) until the component is within `LAZY_ROOT_MARGIN`
 * of the viewport, pauses (without unmounting — keeps whatever's buffered)
 * once it scrolls back out, and falls back to a plain `next/image` poster —
 * no `<video>` element in the DOM whatsoever — under `prefers-reduced-motion`
 * or a data-saver connection. `priority` only changes the *timing* of the
 * lazy gate (skips waiting for scroll), never bypasses either fallback.
 */
export function BrandVideo({
  src,
  poster,
  alt = "",
  aspectRatio,
  className = "",
  priority = false,
}: BrandVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Sticky — once true, sources stay mounted (no re-fetch on repeated
  // scroll in/out). `isVisible` is the live signal that drives play/pause.
  const [hasEnteredViewport, setHasEnteredViewport] = useState(priority);
  const [isVisible, setIsVisible] = useState(priority);
  const { prefersReducedMotion, saveData } = useMediaPreferences();

  const showVideo = !prefersReducedMotion && !saveData;

  useEffect(() => {
    if (!showVideo) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) setHasEnteredViewport(true);
      },
      { rootMargin: LAZY_ROOT_MARGIN, threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [showVideo]);

  // Belt-and-suspenders: some browsers only honor autoplay's mute
  // requirement off the IDL property, not the JSX/HTML attribute alone.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = true;
  }, []);

  // <source> children only enter the DOM once hasEnteredViewport flips —
  // browsers don't rescan for dynamically-inserted sources on their own,
  // so kick a load() the first time they appear.
  useEffect(() => {
    if (!showVideo || !hasEnteredViewport) return;
    videoRef.current?.load();
  }, [showVideo, hasEnteredViewport]);

  // Play while visible, pause (don't unmount) once scrolled away.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showVideo || !hasEnteredViewport) return;
    if (isVisible) {
      video.play().catch(() => {
        // Autoplay can still be blocked in some embedded contexts even
        // when muted+playsInline — silently stay on the poster frame.
      });
    } else {
      video.pause();
    }
  }, [showVideo, hasEnteredViewport, isVisible]);

  if (!showVideo) {
    return (
      <div
        ref={containerRef}
        className={`relative overflow-hidden ${className}`}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <Image
          src={poster}
          alt={alt}
          fill
          sizes="100vw"
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        loop
        autoPlay={priority}
        preload={priority ? "auto" : "none"}
        poster={poster}
        aria-hidden="true"
        className="h-full w-full object-cover"
      >
        {hasEnteredViewport && (
          <>
            <source src={`/video/${src}.webm`} type="video/webm" />
            <source src={`/video/${src}.mp4`} type="video/mp4" />
          </>
        )}
      </video>
    </div>
  );
}
