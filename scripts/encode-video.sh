#!/usr/bin/env bash
set -euo pipefail

# encode-video.sh — turn a raw source clip (e.g. a Higgsfield export) into
# the trio BrandVideo expects, dropped straight into public/video/:
#
#   <name>.webm         VP9 (or --av1), no audio, CRF 32, capped at 1920px wide
#   <name>.mp4           H.264, no audio, faststart (progressive-playback moov)
#   <name>-poster.jpg     first frame, same scale, for the <video poster> /
#                          prefers-reduced-motion fallback
#
# See public/video/README.md for the naming convention BrandVideo's `src`
# prop expects (it's just <name>, no extension).
#
# Usage:
#   scripts/encode-video.sh <input.mp4|input.mov> [output-name] [--av1]
#
# Examples:
#   scripts/encode-video.sh ~/Downloads/higgsfield-hero-loop.mp4
#     → public/video/higgsfield-hero-loop.{webm,mp4}, -poster.jpg
#
#   scripts/encode-video.sh ~/Downloads/raw-export.mov hero-bg
#     → public/video/hero-bg.{webm,mp4}, -poster.jpg
#
#   scripts/encode-video.sh clip.mp4 --av1
#     → same names, AV1 instead of VP9 (smaller file, much slower to
#       encode — reach for it on a clip that'll be reused a lot, not by
#       default)

usage() {
  echo "Usage: $0 <input.mp4|input.mov> [output-name] [--av1]" >&2
  exit 1
}

if [[ $# -lt 1 ]]; then
  usage
fi

INPUT=""
OUTPUT_NAME=""
USE_AV1=false

for arg in "$@"; do
  case "$arg" in
    --av1)
      USE_AV1=true
      ;;
    -h|--help)
      usage
      ;;
    *)
      if [[ -z "$INPUT" ]]; then
        INPUT="$arg"
      elif [[ -z "$OUTPUT_NAME" ]]; then
        OUTPUT_NAME="$arg"
      else
        echo "Unexpected extra argument: $arg" >&2
        usage
      fi
      ;;
  esac
done

if [[ -z "$INPUT" || ! -f "$INPUT" ]]; then
  echo "Input file not found: ${INPUT:-<none given>}" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found on PATH — install it first (brew install ffmpeg / apt install ffmpeg)." >&2
  exit 1
fi

if [[ -z "$OUTPUT_NAME" ]]; then
  BASENAME="$(basename "$INPUT")"
  OUTPUT_NAME="${BASENAME%.*}"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/../public/video"
mkdir -p "$OUT_DIR"

# Never upscale a clip that's already narrower than 1920 — `min(1920,iw)`
# leaves those alone. -2 keeps height even (required by yuv420p/most
# hardware decoders) while preserving aspect ratio.
SCALE_FILTER="scale='min(1920,iw)':-2"

WEBM_OUT="$OUT_DIR/$OUTPUT_NAME.webm"
MP4_OUT="$OUT_DIR/$OUTPUT_NAME.mp4"
POSTER_OUT="$OUT_DIR/$OUTPUT_NAME-poster.jpg"

echo "→ Encoding \"$INPUT\" as \"$OUTPUT_NAME\" into $OUT_DIR/"

echo "  poster ($POSTER_OUT)"
ffmpeg -y -hide_banner -loglevel error -stats \
  -i "$INPUT" -vframes 1 -vf "$SCALE_FILTER" -q:v 2 \
  "$POSTER_OUT"

if [[ "$USE_AV1" == true ]]; then
  echo "  webm — AV1, CRF 32 ($WEBM_OUT)"
  ffmpeg -y -hide_banner -loglevel error -stats \
    -i "$INPUT" -vf "$SCALE_FILTER" \
    -c:v libsvtav1 -crf 32 -preset 6 -an \
    "$WEBM_OUT"
else
  echo "  webm — VP9, CRF 32 ($WEBM_OUT)"
  ffmpeg -y -hide_banner -loglevel error -stats \
    -i "$INPUT" -vf "$SCALE_FILTER" \
    -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 -an \
    "$WEBM_OUT"
fi

echo "  mp4 — H.264, faststart ($MP4_OUT)"
ffmpeg -y -hide_banner -loglevel error -stats \
  -i "$INPUT" -vf "$SCALE_FILTER" \
  -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p -an \
  -movflags +faststart \
  "$MP4_OUT"

echo ""
echo "✓ Done:"
ls -lh "$WEBM_OUT" "$MP4_OUT" "$POSTER_OUT"
echo ""
echo "In code:"
echo "  <BrandVideo src=\"$OUTPUT_NAME\" poster=\"/video/$OUTPUT_NAME-poster.jpg\" ... />"
