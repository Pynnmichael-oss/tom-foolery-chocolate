import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Tom Foolery Chocolate — Live a Little";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [frauncesDisplay, figtreeBlack, icon] = await Promise.all([
    // satori (the ImageResponse renderer) can't parse WOFF2 or variable
    // fonts — these are static instances flattened from Fraunces/Figtree's
    // variable sources (wght 600 opsz 144 WONK 0.5 for the display face,
    // matching Hero's own treatment; wght 900 for the sans), with
    // GSUB/GPOS/GDEF/STAT stripped. Kept out of public/ since they're only
    // used here, not shipped as web fonts — see lib/fonts.ts for the actual
    // site-wide font loading. Regenerate via fontTools if these ever need
    // to change (see this file's git history for the exact pipeline).
    readFile(join(process.cwd(), "assets/og-fonts/Fraunces-Display.ttf")),
    readFile(join(process.cwd(), "assets/og-fonts/Figtree-Black.ttf")),
    readFile(join(process.cwd(), "public/logos/icon-negative.png")),
  ]);
  const iconSrc = `data:image/png;base64,${icon.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#25382A",
        }}
      >
        {/* satori requires a plain <img>, not next/image */}
        <img src={iconSrc} width={130} height={156} alt="" />
        <p
          style={{
            marginTop: 28,
            marginBottom: 0,
            fontFamily: "Figtree Black",
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          Chocolate as Interesting as it is Irresistible
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: "Fraunces Display",
            fontWeight: 600,
            fontSize: 130,
            lineHeight: 1,
            color: "#FFFFFF",
          }}
        >
          Live a Little
        </p>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces Display", data: frauncesDisplay, style: "normal", weight: 600 },
        { name: "Figtree Black", data: figtreeBlack, style: "normal", weight: 900 },
      ],
    }
  );
}
