import Image from "next/image";
import Link from "next/link";
import { Preheader, Headline, BodyText } from "@/components/ui/typography";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { formatMoney } from "@/lib/shopify/format";
import { shortFlavorName } from "@/lib/gift-builder/cart-line";
import type { GiftBand, GiftBuilderConfig } from "@/lib/gift-builder/queries";

/** Cheapest variant price ("From $28") for a builder product. */
function fromPrice(config: GiftBuilderConfig): string | null {
  const prices = config.variants.filter((v) => v.availableForSale).map((v) => v.price);
  if (prices.length === 0) return null;
  const min = prices.reduce((a, b) => (Number(b.amount) < Number(a.amount) ? b : a));
  return formatMoney(min);
}

/** Up to `max` band photos, one per occasion first so the strip shows
 * the range (Holiday, Birthday, Thank You…), in the order set in Shopify. */
function showcaseBands(bands: GiftBand[], max = 4): GiftBand[] {
  const withImage = bands.filter((b) => b.image);
  const picked: GiftBand[] = [];
  const seen = new Set<string>();
  for (const b of withImage) {
    if (picked.length < max && !seen.has(b.category)) {
      picked.push(b);
      seen.add(b.category);
    }
  }
  for (const b of withImage) if (picked.length < max && !picked.includes(b)) picked.push(b);
  return picked;
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-3 rounded-3xl bg-tf-white p-fluid-sm shadow-[0_2px_0_0_var(--tf-black)] ring-2 ring-tf-black">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-full bg-tf-black font-sans text-sm font-black text-tf-white"
        >
          {n}
        </span>
        <p className="pt-1 font-sans font-black leading-tight">{title}</p>
      </div>
      {children}
    </li>
  );
}

/**
 * Homepage feature for the build-your-own gift set (/gifts/build). Turmeric
 * band directly under the marquee: pitch + CTA on one side, the three
 * builder steps on the other, illustrated with the real flavor and band
 * photos from Shopify — so new band designs show up here without a deploy.
 *
 * Rendered only when the bar set product is live on the Storefront (see
 * app/page.tsx), same rule as the /gifting entry point.
 */
export function GiftBuilderFeature({
  bars,
  caramels,
}: {
  bars: GiftBuilderConfig;
  caramels: GiftBuilderConfig | null;
}) {
  const barsFrom = fromPrice(bars);
  const caramelsFrom = caramels ? fromPrice(caramels) : null;
  const bands = showcaseBands(bars.bands);
  const flavors = bars.flavors.filter((f) => f.featuredImage).slice(0, 3);
  const boxSizes = bars.sizes.join(" or ").toLowerCase(); // "3 bars or 6 bars"

  return (
    <section aria-label="Build your own gift set" className="bg-tf-turmeric px-fluid-md py-fluid-xl text-tf-black">
      <div className="mx-auto grid max-w-6xl items-center gap-fluid-lg lg:grid-cols-[6fr_7fr]">
        {/* Pitch + CTA */}
        <div className="flex flex-col items-start gap-fluid-sm">
          <Preheader>Build Your Own Gift Set</Preheader>
          {/* Two deliberate lines — left to wrap freely it breaks as
           * "One for / Them. Two / for You." on desktop. */}
          <Headline as="h2" size="md">
            {["One for Them.", "Two for You."]}
          </Headline>
          <BodyText className="max-w-md text-tf-black/85">
            You don&rsquo;t need an occasion. But the holidays are coming&hellip; Pick their favorite bars,
            choose a band for the occasion, and add a note. We&rsquo;ll pack it by hand, in small batches,
            right here in Chicago.
          </BodyText>
          <div className="mt-fluid-xs flex flex-wrap items-center gap-x-fluid-sm gap-y-3">
            <Link href="/gifts/build?set=bars" className={buttonClasses("primary")}>
              Build Your Gift Set
            </Link>
            {barsFrom ? <span className="font-sans text-sm font-semibold">From {barsFrom}</span> : null}
          </div>
          {caramels ? (
            <Link
              href="/gifts/build?set=caramels"
              className="font-sans text-sm font-semibold underline decoration-2 underline-offset-4 hover:text-tf-cinnamon-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-black"
            >
              Or try the {caramels.title}
              {caramelsFrom ? ` · from ${caramelsFrom}` : ""}&nbsp;→
            </Link>
          ) : null}
        </div>

        {/* The three steps, with real photos */}
        <ol className="grid gap-fluid-sm" aria-label="How it works">
          <Step n={1} title={`Pick ${boxSizes}`}>
            {flavors.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {flavors.map((f) => (
                  <figure key={f.id} className="flex flex-col gap-1">
                    <span className="relative aspect-square overflow-hidden rounded-xl bg-tf-black/5">
                      <Image
                        src={f.featuredImage!.url}
                        alt={f.featuredImage!.altText ?? f.title}
                        fill
                        sizes="(min-width: 1024px) 180px, 30vw"
                        className="object-cover"
                      />
                    </span>
                    <figcaption className="font-sans text-[0.7rem] leading-tight text-tf-black/75">
                      {shortFlavorName(f.title)}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
          </Step>

          <Step n={2} title="Choose a band for the occasion">
            {bands.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {bands.map((b) => (
                  <figure key={b.id} className="flex flex-col gap-1">
                    <span className="relative aspect-[4/3] overflow-hidden rounded-xl bg-tf-black/5">
                      <Image
                        src={b.image!.url}
                        alt={b.image!.altText ?? `${b.name} band`}
                        fill
                        sizes="(min-width: 1024px) 140px, (min-width: 640px) 22vw, 45vw"
                        className="object-cover"
                      />
                    </span>
                    <figcaption className="font-sans text-[0.7rem] leading-tight text-tf-black/75">{b.category}</figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
          </Step>

          <Step n={3} title="Add gift wrap & a note">
            {/* A sample gift note, shown the way it'd be written on the card. */}
            <div className="flex flex-1 flex-col justify-between gap-3 rounded-xl border-2 border-dashed border-tf-black/25 bg-tf-rose/30 p-3">
              <p className="font-display text-lg italic leading-snug">&ldquo;One for you. (I&nbsp;already ate&nbsp;mine.)&rdquo;</p>
              <p className="font-sans text-[0.7rem] text-tf-black/75">
                Up to {bars.noteMaxLength} characters · gift wrap +$1
              </p>
            </div>
          </Step>
        </ol>
      </div>
    </section>
  );
}
