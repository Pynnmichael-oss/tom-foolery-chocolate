"use client";

import { useEffect, useRef, useState } from "react";

/** The outlet site's own icon, from the article's domain. Google's favicon
 * service returns the best size the site offers, up to the one asked for. */
function faviconUrl(articleUrl: string): string {
  const host = new URL(articleUrl).hostname;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
}

/**
 * Top of a featured press card: a logo slot, then the outlet name. The
 * slot shows the Logo from the press sheet, or the outlet site's icon
 * when there is none, or when the Logo link doesn't load (a pasted page
 * link instead of an image, or an image the outlet has since moved).
 *
 * Plain <img>, not next/image: the sources are arbitrary outside hosts
 * that can't all be listed in next.config's remotePatterns.
 */
export function OutletMark({
  outlet,
  url,
  logo,
}: {
  outlet: string;
  url: string;
  logo?: string;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const logoRef = useRef<HTMLImageElement>(null);
  const showLogo = Boolean(logo) && !logoFailed;

  // An image that failed before hydration never fires onError for React,
  // so check once on mount as well.
  useEffect(() => {
    const img = logoRef.current;
    if (img && img.complete && img.naturalWidth === 0) setLogoFailed(true);
  }, []);

  return (
    <div className="flex items-center gap-fluid-xs">
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={logoRef}
          src={logo}
          alt=""
          onError={() => setLogoFailed(true)}
          className="h-10 w-auto max-w-[8rem] shrink-0 rounded-[4px] object-contain"
        />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-tf-black/15 bg-tf-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={faviconUrl(url)} alt="" width={28} height={28} className="size-7" />
        </span>
      )}
      <span className="font-sans font-black uppercase tracking-[0.075em]">{outlet}</span>
    </div>
  );
}
