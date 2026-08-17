# Brand video clips

Empty on purpose — this is where AI-generated brand clips (Higgsfield, or
whatever comes next) land once they're encoded. Nothing in the codebase
requires a file here to exist: `BrandVideo` (`src/components/media/
BrandVideo.tsx`) always renders a poster/image fallback first, so every
integration point (Hero's `backgroundVideo`, StorySection's `media` slot,
ProductCard's `hoverVideo`) stays fully functional with this folder empty.

## Naming convention

Each clip is **one base name**, three files:

```
<name>.webm          VP9 (or AV1), no audio — tried first
<name>.mp4            H.264, no audio, faststart — fallback
<name>-poster.jpg      first frame, same scale — <video poster> /
                        prefers-reduced-motion fallback
```

`BrandVideo`'s `src` prop takes just `<name>` (no extension, no leading
`/video/`) and resolves both sources itself. `poster` is a full path you
pass separately (e.g. `/video/hero-loop-poster.jpg`), since it's also used
standalone as the entire visible output under reduced-motion/data-saver.

## Generating the trio

Use `scripts/encode-video.sh` — see that file's header comment for full
usage, short version:

```bash
scripts/encode-video.sh ~/Downloads/higgsfield-export.mp4 hero-loop
```

produces `hero-loop.webm`, `hero-loop.mp4`, and `hero-loop-poster.jpg` right
here, sized and encoded for the web (capped at 1920px wide, CRF ~32 on the
webm, no audio track on either — every current use is a silent, looping
background clip).

Raw exports are gitignored if dropped at the repo root as `<name>-source.mp4`
(or `.mov`) — only the encoded trio here in `public/video/` gets committed.

## Wiring a clip in

```tsx
// Hero background
<Hero backgroundVideo="hero-loop" backgroundVideoPoster="/video/hero-loop-poster.jpg" />

// StorySection media slot — same aspect-ratio wrapper convention as a photo
<StorySection
  media={
    <div className="aspect-[4/5] overflow-hidden rounded-2xl">
      <BrandVideo src="craft-process" poster="/video/craft-process-poster.jpg" className="h-full w-full" />
    </div>
  }
  ...
/>

// ProductCard hover preview
<ProductCard product={product} hoverVideo="midnight-jester-pour" />
```
