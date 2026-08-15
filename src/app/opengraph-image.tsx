import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Tom Foolery Chocolate — Live a Little";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [featureDeck, sofiaBlack, icon] = await Promise.all([
    // satori (the ImageResponse renderer) can't parse WOFF2 or variable
    // fonts — these are static, non-variable TTF instances of the same
    // font files, kept out of public/ since they're only used here, not
    // shipped as web fonts.
    readFile(join(process.cwd(), "assets/og-fonts/FeatureDeck-Regular.ttf")),
    readFile(join(process.cwd(), "assets/og-fonts/SofiaPro-Black.ttf")),
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
            fontFamily: "Sofia Pro Black",
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
            fontFamily: "Feature Deck",
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
        { name: "Feature Deck", data: featureDeck, style: "normal", weight: 400 },
        { name: "Sofia Pro Black", data: sofiaBlack, style: "normal", weight: 900 },
      ],
    }
  );
}
