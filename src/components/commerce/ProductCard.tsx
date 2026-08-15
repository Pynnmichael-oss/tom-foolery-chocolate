import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/shopify/format";
import type { Product } from "@/lib/shopify/types";

export interface ProductCardProps {
  product: Product;
  className?: string;
}

/** Photography-forward product card. Whole card is the link; the only
 * motion is a subtle, motion-safe tilt/scale on the image on hover. */
export function ProductCard({ product, className = "" }: ProductCardProps) {
  const image = product.images[0];
  const { min, max } = product.priceRange;
  const price = min.amount === max.amount ? formatMoney(min) : `From ${formatMoney(min)}`;

  return (
    <Link href={`/shop/${product.handle}`} className={`group block ${className}`}>
      <div className="aspect-square overflow-hidden rounded-2xl bg-tf-black/5">
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
      </div>

      <h2 className="mt-fluid-sm font-display text-lg leading-tight text-fg sm:text-xl">
        {product.title}
      </h2>
      <p className="font-sans text-fg/70">{price}</p>
    </Link>
  );
}
