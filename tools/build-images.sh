#!/usr/bin/env bash
# Converte le immagini del dataset free-exercise-db in WebP ottimizzati per il web.
# full  : lato max 440px, q74  (vista dettaglio esercizio)
# thumb : lato max 160px, q70  (liste e card)
set -euo pipefail

SRC="${1:-db-exercise/exercises}"
DEST="${2:-apps/web/public/img/ex}"

mkdir -p "$DEST"

find "$SRC" -type f -name '*.jpg' -print0 \
  | xargs -0 -P 8 -I {} bash -c '
      src="$1"; dest="$2"
      rel="${src#*/exercises/}"          # ID/0.jpg
      id="${rel%%/*}"
      frame="$(basename "${rel%.jpg}")"
      out="$dest/$id"
      mkdir -p "$out"
      magick "$src" -resize 440x440\> -quality 74 -define webp:method=6 -strip "$out/$frame.webp"
      if [ "$frame" = "0" ]; then
        magick "$src" -resize 160x160\> -quality 70 -define webp:method=6 -strip "$out/thumb.webp"
      fi
    ' _ {} "$DEST"

echo "Fatto. Immagini generate in $DEST"
du -sh "$DEST"
