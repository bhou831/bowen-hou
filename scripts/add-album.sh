#!/bin/bash
# Add a photography collection without modifying the source photos.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PHOTO_BLOG_DIR="${PHOTO_IMPORT_PROJECT_ROOT:-$DEFAULT_PROJECT_ROOT}"
SOURCE_ROOT="${PHOTO_IMPORT_SOURCE_ROOT:-$HOME/Desktop}"
PUBLIC_COLLECTIONS="$PHOTO_BLOG_DIR/public/images/collections"
COLLECTIONS_JSON="$PHOTO_BLOG_DIR/src/content/photography/collections.json"

FOLDER_NAME=""
COVER_FILE=""
ALBUM_ID=""
STAGE_DIR=""
JSON_TEMP=""
DEST_DIR=""
DEST_INSTALLED=false

usage() {
    echo "Usage: $0 --path <folder_name> --cover <filename> [--name <album_id>]"
    echo ""
    echo "  --path    Folder name on ~/Desktop (e.g. tokyo2025)"
    echo "  --cover   Cover photo filename with extension (e.g. 1.jpg)"
    echo "  --name    Album ID, defaults to folder name"
    echo ""
    echo "The source folder is read-only and remains unchanged."
    exit "${1:-1}"
}

cleanup() {
    if [ -n "$STAGE_DIR" ] && [ -d "$STAGE_DIR" ]; then
        rm -rf "$STAGE_DIR"
    fi
    if [ -n "$JSON_TEMP" ] && [ -f "$JSON_TEMP" ]; then
        rm -f "$JSON_TEMP"
    fi
    if [ "$DEST_INSTALLED" = true ] && [ -n "$DEST_DIR" ] && [ -d "$DEST_DIR" ]; then
        rm -rf "$DEST_DIR"
    fi
}

trap cleanup EXIT

while [[ $# -gt 0 ]]; do
    case "$1" in
        --path)
            [[ $# -ge 2 ]] || usage 1
            FOLDER_NAME="$2"
            shift 2
            ;;
        --cover)
            [[ $# -ge 2 ]] || usage 1
            COVER_FILE="$2"
            shift 2
            ;;
        --name)
            [[ $# -ge 2 ]] || usage 1
            ALBUM_ID="$2"
            shift 2
            ;;
        -h|--help)
            usage 0
            ;;
        *)
            usage 1
            ;;
    esac
done

if [ -z "$FOLDER_NAME" ] || [ -z "$COVER_FILE" ]; then
    usage 1
fi

if [[ "$FOLDER_NAME" == "." || "$FOLDER_NAME" == ".." || "$FOLDER_NAME" == *"/"* || "$FOLDER_NAME" == *"\\"* ]]; then
    echo "Error: --path must be a folder name, not a path traversal."
    exit 1
fi

if [[ "$COVER_FILE" == "." || "$COVER_FILE" == ".." || "$COVER_FILE" == *"/"* || "$COVER_FILE" == *"\\"* ]]; then
    echo "Error: --cover must be a filename within the source folder."
    exit 1
fi

ALBUM_ID="${ALBUM_ID:-$FOLDER_NAME}"
if [[ ! "$ALBUM_ID" =~ ^[A-Za-z0-9][A-Za-z0-9_-]*$ ]]; then
    echo "Error: Album IDs may only contain letters, numbers, underscores, and hyphens."
    exit 1
fi

for command in ffmpeg node; do
    if ! command -v "$command" >/dev/null 2>&1; then
        echo "Error: $command is required."
        exit 1
    fi
done

if [ ! -f "$COLLECTIONS_JSON" ]; then
    echo "Error: Collections metadata not found: $COLLECTIONS_JSON"
    exit 1
fi

SRC_DIR="$SOURCE_ROOT/$FOLDER_NAME"
if [ ! -d "$SRC_DIR" ]; then
    echo "Error: Source folder does not exist: $SRC_DIR"
    exit 1
fi

if [ ! -f "$SRC_DIR/$COVER_FILE" ]; then
    echo "Error: Cover file not found: $SRC_DIR/$COVER_FILE"
    exit 1
fi

DEST_DIR="$PUBLIC_COLLECTIONS/$ALBUM_ID"
if [ -e "$DEST_DIR" ]; then
    echo "Error: $DEST_DIR already exists. Use --name to choose a different ID."
    exit 1
fi

node - "$COLLECTIONS_JSON" "$ALBUM_ID" <<'NODE'
const fs = require('fs');
const [collectionsFile, albumId] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(collectionsFile, 'utf8'));

if (!Array.isArray(data.collections)) {
    console.error('Error: collections.json must contain a collections array.');
    process.exit(1);
}

if (data.collections.some((collection) => collection.id === albumId)) {
    console.error(`Error: Album ID "${albumId}" already exists in collections.json.`);
    process.exit(1);
}
NODE

mkdir -p "$PUBLIC_COLLECTIONS"
STAGE_DIR="$(mktemp -d "$PUBLIC_COLLECTIONS/.${ALBUM_ID}.import.XXXXXX")"
JSON_TEMP="$(mktemp "$COLLECTIONS_JSON.tmp.XXXXXX")"

shopt -s nullglob nocaseglob
SOURCE_FILES=("$SRC_DIR"/*.jpg "$SRC_DIR"/*.jpeg)
shopt -u nocaseglob

if [ "${#SOURCE_FILES[@]}" -eq 0 ]; then
    echo "Error: No JPEG photos found in $SRC_DIR"
    exit 1
fi

echo "==> Album:  $ALBUM_ID"
echo "==> Source: $SRC_DIR"
echo "==> Dest:   $DEST_DIR"
echo ""
echo "[ 1/4 ] Generating cover.jpg from $COVER_FILE..."

ffmpeg -nostdin -loglevel error \
    -i "$SRC_DIR/$COVER_FILE" \
    -vf "scale=w=1920:h=1080:force_original_aspect_ratio=decrease" \
    -q:v 3 \
    -y \
    "$STAGE_DIR/cover.jpg"

echo "[ 2/4 ] Compressing photos into a staging directory..."

COVER_EXT="${COVER_FILE##*.}"
ffmpeg -nostdin -loglevel error \
    -i "$SRC_DIR/$COVER_FILE" \
    -vf "scale='min(4000,iw)':'min(4000,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2" \
    -q:v 3 \
    -y \
    "$STAGE_DIR/${ALBUM_ID}_1.${COVER_EXT}"

counter=2
for source_file in "${SOURCE_FILES[@]}"; do
    file_name="$(basename "$source_file")"

    if [ "$file_name" = "$COVER_FILE" ]; then
        continue
    fi
    if [[ "$file_name" == [Cc][Oo][Vv][Ee][Rr].[Jj][Pp][Gg] ]]; then
        continue
    fi

    extension="${file_name##*.}"
    output_file="${ALBUM_ID}_${counter}.${extension}"
    echo "    $file_name → $output_file"

    ffmpeg -nostdin -loglevel error \
        -i "$source_file" \
        -vf "scale='min(4000,iw)':'min(4000,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2" \
        -q:v 3 \
        -y \
        "$STAGE_DIR/$output_file"

    ((counter += 1))
done

TOTAL_PHOTOS=$((counter - 1))
echo "    Compressed $TOTAL_PHOTOS photo(s) total."
echo "[ 3/4 ] Preparing collections.json..."

node - "$ALBUM_ID" "$STAGE_DIR" "$COLLECTIONS_JSON" "$JSON_TEMP" <<'NODE'
const fs = require('fs');
const [albumId, stageDirectory, collectionsFile, outputFile] =
  process.argv.slice(2);

const images = fs
  .readdirSync(stageDirectory)
  .filter(
    (fileName) =>
      /\.(jpg|jpeg)$/i.test(fileName) && fileName.toLowerCase() !== 'cover.jpg',
  )
  .sort((left, right) => {
    const leftNumber = Number(left.match(/_(\d+)\./)?.[1] ?? 0);
    const rightNumber = Number(right.match(/_(\d+)\./)?.[1] ?? 0);
    return leftNumber - rightNumber;
  })
  .map((fileName) => `/images/collections/${albumId}/${fileName}`);

if (images.length === 0) {
  console.error('Error: The staged collection contains no gallery images.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(collectionsFile, 'utf8'));
const newEntry = {
  id: albumId,
  title: '',
  description: '',
  coverImage: `/images/collections/${albumId}/cover.jpg`,
  images,
};

data.collections.unshift(newEntry);
fs.writeFileSync(outputFile, `${JSON.stringify(data, null, 2)}\n`);
JSON.parse(fs.readFileSync(outputFile, 'utf8'));
NODE

echo "[ 4/4 ] Installing the completed collection..."
mv "$STAGE_DIR" "$DEST_DIR"
STAGE_DIR=""
DEST_INSTALLED=true

mv "$JSON_TEMP" "$COLLECTIONS_JSON"
JSON_TEMP=""
DEST_INSTALLED=false

echo ""
echo "✓ Done! Album '$ALBUM_ID' has been added."
echo "  The source folder remains unchanged at $SRC_DIR"
echo ""
echo "Next steps:"
echo "  1. Open src/content/photography/collections.json"
echo "  2. Find the '$ALBUM_ID' entry and fill in title and description"
echo "  3. Run: npm run validate-content"
