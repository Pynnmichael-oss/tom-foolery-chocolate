import type { Stockist } from "@/lib/stockists/types";

/** Google Maps handles "name + address" better than a bare address (it
 * lands on the business listing, hours and all) and opens the native
 * app on phones. */
function directionsUrl(stockist: Stockist): string {
  const destination = `${stockist.name}, ${stockist.street}, ${stockist.city}, ${stockist.state} ${stockist.zip}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

const LINK_CLASS =
  "font-sans text-xs font-black uppercase tracking-[0.075em] text-tf-black underline decoration-tf-cinnamon decoration-2 underline-offset-4 hover:text-tf-cinnamon-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-cinnamon";

/**
 * Address + links for one stockist — the part shared by a row in the
 * results list and the popup on the map, so the two can't drift apart.
 * The name itself is rendered by each caller (a button in the list, a
 * heading in the popup).
 */
export function StockistDetails({ stockist }: { stockist: Stockist }) {
  return (
    <>
      <address className="font-sans text-sm not-italic leading-snug text-tf-black/75">
        {stockist.street && (
          <>
            {stockist.street}
            <br />
          </>
        )}
        {stockist.city}, {stockist.state}
        {stockist.street && ` ${stockist.zip}`}
      </address>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {stockist.street && (
          <a href={directionsUrl(stockist)} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            Directions
            <span className="sr-only"> to {stockist.name} (opens in a new tab)</span>
          </a>
        )}
        {stockist.website && (
          <a href={stockist.website} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            Website
            <span className="sr-only"> for {stockist.name} (opens in a new tab)</span>
          </a>
        )}
        {stockist.instagram && (
          <a
            href={`https://www.instagram.com/${stockist.instagram}/`}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          >
            Instagram
            <span className="sr-only"> for {stockist.name} (opens in a new tab)</span>
          </a>
        )}
        {stockist.phone && (
          <a href={`tel:+1${stockist.phone.replace(/\D/g, "")}`} className={LINK_CLASS}>
            {stockist.phone}
          </a>
        )}
      </div>
    </>
  );
}
