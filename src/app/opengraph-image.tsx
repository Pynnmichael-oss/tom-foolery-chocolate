import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Tom Foolery Chocolate — Live a Little";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [newsreaderDisplay, poppinsBlack, icon] = await Promise.all([
    // satori (the ImageResponse renderer) can't parse WOFF2 or variable
    // fonts — the display face is a static instance flattened from
    // Newsreader's variable source (wght 600 opsz 72 — opsz maxed out,
    // matching what font-size:130 would resolve to under the browser's
    // optical-sizing auto behavior; Newsreader has no WONK axis, unlike
    // Fraunces before it), with GSUB/GPOS/GDEF/STAT stripped. Poppins has
    // no variable source on Google Fonts, so the sans face is its static
    // Black (900) weight file as-is, GSUB/GPOS/GDEF stripped the same way.
    // Kept out of public/ since they're only used here, not shipped as web
    // fonts — see lib/fonts.ts for the actual site-wide font loading.
    // Regenerate via fontTools if these ever need to change (see this
    // file's git history for the exact pipeline).
    readFile(join(process.cwd(), "assets/og-fonts/Newsreader-Display.ttf")),
    readFile(join(process.cwd(), "assets/og-fonts/Poppins-Black.ttf")),
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
            fontFamily: "Poppins Black",
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
            fontFamily: "Newsreader Display",
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
        { name: "Newsreader Display", data: newsreaderDisplay, style: "normal", weight: 600 },
        { name: "Poppins Black", data: poppinsBlack, style: "normal", weight: 900 },
      ],
    }
  );
}
