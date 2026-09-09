import Image from "next/image";

export interface ScrapbookPhotoProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  /** Degrees, positive or negative — brief calls for 2-4deg, alternating
   * across a cluster. */
  rotation?: number;
  className?: string;
}

/** Deterministic torn-paper zigzag — jagged top/bottom edges, straight
 * sides, generated rather than hand-typed as a long `polygon()` literal.
 * `teeth` controls how fine the tear reads; the alternating 0%/3%
 * (top) and 100%/97% (bottom) offsets are the "torn" part. */
function tornEdgeClipPath(teeth = 10): string {
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= teeth; i++) {
    const x = (i / teeth) * 100;
    top.push(`${x}% ${i % 2 === 0 ? 0 : 3}%`);
  }
  for (let i = teeth; i >= 0; i--) {
    const x = (i / teeth) * 100;
    bottom.push(`${x}% ${i % 2 === 0 ? 100 : 97}%`);
  }
  return `polygon(${[...top, ...bottom].join(", ")})`;
}

const TORN_EDGE_CLIP_PATH = tornEdgeClipPath();

/**
 * A single "scrapbook photo" — real product/lifestyle photography (see
 * brand/PHOTO_INVENTORY.md) presented as a tilted, torn-edge print:
 * slight rotation, a soft drop shadow, and a jagged top/bottom edge via
 * `clip-path` (procedural zigzag polygon — no image mask asset needed).
 * Used in `HeritageBeat`'s photo cluster.
 *
 * TODO(client-assets): these are the brand guide's own extracted product
 * photography (brand/PHOTO_INVENTORY.md), not real heritage/founder/
 * behind-the-scenes photos — swap for the real thing once the client
 * provides it. No code changes needed beyond the `src`/`alt`/dimensions
 * passed in from `HeritageBeat`.
 */
export function ScrapbookPhoto({
  src,
  alt,
  width,
  height,
  sizes,
  rotation = 3,
  className = "",
}: ScrapbookPhotoProps) {
  return (
    <div
      className={`overflow-hidden shadow-[0_14px_28px_-10px_rgba(37,56,42,0.4)] ${className}`}
      style={{ transform: `rotate(${rotation}deg)`, clipPath: TORN_EDGE_CLIP_PATH }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
