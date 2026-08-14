# Placeholder fonts

`FeatureDeck-Regular.woff2`, `SofiaPro-Regular.woff2`, and `SofiaPro-Black.woff2`
in this folder are **stand-ins**, not the licensed brand fonts. They're
OFL-licensed Geist webfont binaries (self-hosted via `next/font/google` in
another local project) renamed so `next/font/local` has real files to compile
against and the build/dev server run clean.

Swap them for the actual licensed WOFF2s before shipping:

- `FeatureDeck-Regular.woff2` → Feature Deck Regular
- `SofiaPro-Regular.woff2` → Sofia Pro Regular
- `SofiaPro-Black.woff2` → Sofia Pro Black

File names must stay the same (or update the `src` paths in
`src/lib/fonts.ts` to match). No other code changes are needed — `next/font`
regenerates hashes and metrics automatically.
