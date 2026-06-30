#!/bin/bash
# Cap existing collection photos at 4000px on their longest edge.
# The default mode only reports affected files. Pass --apply to rewrite them.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PHOTO_BLOG_DIR="$(dirname "$SCRIPT_DIR")"
COLLECTIONS_DIR="$PHOTO_BLOG_DIR/public/images/collections"
MAX_EDGE=4000
APPLY=false

usage() {
    echo "Usage: $0 [--apply]"
    echo ""
    echo "Without --apply, lists photos whose longest edge exceeds ${MAX_EDGE}px."
    echo "With --apply, resizes those photos in place using ffmpeg."
    exit "${1:-0}"
}

case "${1:-}" in
    "") ;;
    --apply) APPLY=true ;;
    -h|--help) usage 0 ;;
    *) usage 1 ;;
esac

for command in ffmpeg ffprobe; do
    if ! command -v "$command" >/dev/null 2>&1; then
        echo "Error: $command is required"
        exit 1
    fi
done

if [ ! -d "$COLLECTIONS_DIR" ]; then
    echo "Error: Collection directory not found: $COLLECTIONS_DIR"
    exit 1
fi

scanned=0
outliers=0
resized=0
failed=0
current_temp=""

cleanup() {
    if [ -n "$current_temp" ] && [ -f "$current_temp" ]; then
        rm -f "$current_temp"
    fi
}

trap cleanup EXIT

while IFS= read -r -d '' file; do
    ((scanned++))

    dimensions=$(ffprobe -v error \
        -select_streams v:0 \
        -show_entries stream=width,height \
        -of csv=s=x:p=0 \
        "$file")

    if [[ ! "$dimensions" =~ ^[0-9]+x[0-9]+$ ]]; then
        echo "Warning: Could not read dimensions: $file"
        ((failed++))
        continue
    fi

    width=${dimensions%x*}
    height=${dimensions#*x}

    if (( width <= MAX_EDGE && height <= MAX_EDGE )); then
        continue
    fi

    ((outliers++))
    relative_path=${file#"$PHOTO_BLOG_DIR/"}

    if [ "$APPLY" = false ]; then
        echo "$dimensions  $relative_path"
        continue
    fi

    extension=${file##*.}
    temp_file="${file%.*}.resize-temp.${extension}"
    current_temp="$temp_file"
    echo "Resizing $dimensions  $relative_path"

    if ffmpeg -nostdin -loglevel error \
        -i "$file" \
        -vf "scale='min(${MAX_EDGE},iw)':'min(${MAX_EDGE},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2" \
        -q:v 3 \
        -y \
        "$temp_file"; then
        mv "$temp_file" "$file"
        current_temp=""
        ((resized++))
    else
        echo "Error: Failed to resize $relative_path"
        rm -f "$temp_file"
        current_temp=""
        ((failed++))
    fi
done < <(
    find "$COLLECTIONS_DIR" -type f \
        \( -iname '*.jpg' -o -iname '*.jpeg' \) \
        -print0
)

echo ""
if [ "$APPLY" = false ]; then
    echo "Dry run: found $outliers outlier(s) among $scanned photo(s)."
    if (( outliers > 0 )); then
        echo "Run '$0 --apply' to resize them in place."
    fi
else
    echo "Done: resized $resized of $outliers outlier(s) among $scanned photo(s)."
fi

if (( failed > 0 )); then
    echo "Failures: $failed"
    exit 1
fi
