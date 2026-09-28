import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

/**
 * PWA/home-screen manifest, served at `/manifest.webmanifest` by file
 * convention (Next auto-links it in `<head>` — no metadata field needed).
 * Icons are the eyes-and-hat mark (`public/logos/icon-negative.png`,
 * same source as `app/opengraph-image.tsx`) composited onto a
 * `--tf-black` square — see the git history for the generation script if
 * these ever need to be regenerated from a new source mark. The
 * `apple-icon.png` file convention (`app/apple-icon.png`) covers iOS
 * home-screen icons separately; this manifest is for Android/desktop
 * install prompts.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Tom Foolery",
    description: "Chocolate as Interesting as it is Irresistible.",
    start_url: "/",
    display: "standalone",
    background_color: "#25382a", // --tf-black
    theme_color: "#25382a", // --tf-black
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
