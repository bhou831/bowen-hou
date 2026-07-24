#!/bin/bash
# scripts/add-album.sh - Add a new photo collection

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PHOTO_BLOG_DIR="$(dirname "$SCRIPT_DIR")"
PUBLIC_COLLECTIONS="$PHOTO_BLOG_DIR/public/images/collections"
COLLECTIONS_JSON="$PHOTO_BLOG_DIR/src/content/photography/collections.json"

usage() {
    echo "Usage: $0 --path <folder_name> --cover <filename> [--name <album_id>]"
    echo ""
    echo "  --path    Folder name on ~/Desktop (e.g. tokyo2025)"
    echo "  --cover   Cover photo filename with extension (e.g. 1.jpg)"
    echo "  --name    Album ID, defaults to folder name"
    echo ""
    echo "Example: $0 --path tokyo2025 --cover 1.jpg"
    exit 1
}

# Parse args
while [[ $# -gt 0 ]]; do
    case "$1" in
        --path)  FOLDER_NAME="$2"; shift 2 ;;
        --cover) COVER_FILE="$2";  shift 2 ;;
        --name)  ALBUM_ID="$2";    shift 2 ;;
        *) usage ;;
    esac
done

if [ -z "$FOLDER_NAME" ] || [ -z "$COVER_FILE" ]; then
    usage
fi

SRC_DIR="$HOME/Desktop/$FOLDER_NAME"
ALBUM_ID="${ALBUM_ID:-$FOLDER_NAME}"

# Validate source directory
if [ ! -d "$SRC_DIR" ]; then
    echo "Error: $SRC_DIR does not exist"
    exit 1
fi

# Validate cover file
if [ ! -f "$SRC_DIR/$COVER_FILE" ]; then
    echo "Error: Cover file not found: $SRC_DIR/$COVER_FILE"
    exit 1
fi

# Prevent overwriting an existing collection
DEST_DIR="$PUBLIC_COLLECTIONS/$ALBUM_ID"
if [ -d "$DEST_DIR" ]; then
    echo "Error: $DEST_DIR already exists. Remove it first or use --name to choose a different ID."
    exit 1
fi

echo "==> Album:  $ALBUM_ID"
echo "==> Source: $SRC_DIR"
echo "==> Dest:   $DEST_DIR"
echo ""

# ── Step 1: Generate cover.jpg ─────────────────────────────────────────────
echo "[ 1/4 ] Generating cover.jpg from $COVER_FILE..."
ffmpeg -loglevel error \
    -i "$SRC_DIR/$COVER_FILE" \
    -vf "scale=w=1920:h=1080:force_original_aspect_ratio=decrease" \
    -q:v 3 \
    -y \
    "$SRC_DIR/cover.jpg"

if [ $? -ne 0 ]; then
    echo "Error: Failed to generate cover.jpg"
    exit 1
fi

# ── Step 2: Compress all photos ────────────────────────────────────────────
# Cover photo → {albumId}_1 (always first), then remaining photos from _2 onward
echo "[ 2/4 ] Compressing photos..."

cd "$SRC_DIR" || exit 1

COVER_EXT="${COVER_FILE##*.}"

# Compress cover photo first → becomes {albumId}_1
ffmpeg -loglevel error \
    -i "$COVER_FILE" \
    -vf "scale='min(4000,iw)':'min(4000,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2" \
    -q:v 3 \
    -y \
    "${ALBUM_ID}_1.${COVER_EXT}"

if [ $? -ne 0 ]; then
    echo "Error: Failed to compress cover photo"
    exit 1
fi

rm "$COVER_FILE"

# Compress remaining photos starting from counter=2
counter=2
for file in *.jpg *.jpeg *.JPG *.JPEG; do
    [ -e "$file" ] || continue
    [ "$file" = "cover.jpg" ] && continue
    [[ "$file" == ${ALBUM_ID}_* ]] && continue  # already processed

    ext="${file##*.}"
    new_filename="${ALBUM_ID}_${counter}.${ext}"
    echo "    $file → $new_filename"

    ffmpeg -loglevel error \
        -i "$file" \
        -vf "scale='min(4000,iw)':'min(4000,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2" \
        -q:v 3 \
        -y \
        "$new_filename"

    if [ $? -ne 0 ]; then
        echo "Error: Failed to compress $file"
        exit 1
    fi

    rm "$file"
    ((counter++))
done

TOTAL_PHOTOS=$((counter - 1))
echo "    Compressed $TOTAL_PHOTOS photo(s) total."

# ── Step 3: Move folder to public collections ──────────────────────────────
echo "[ 3/4 ] Moving folder to public/images/collections/$ALBUM_ID/..."
mkdir -p "$PUBLIC_COLLECTIONS"
mv "$SRC_DIR" "$DEST_DIR"

if [ $? -ne 0 ]; then
    echo "Error: Failed to move folder to $DEST_DIR"
    exit 1
fi

# ── Step 4: Update collections.json ───────────────────────────────────────
echo "[ 4/4 ] Updating collections.json..."
node -e "
const fs = require('fs');
const albumId = '$ALBUM_ID';
const destDir = '$DEST_DIR';
const collectionsFile = '$COLLECTIONS_JSON';

// Collect compressed photos, sorted numerically, cover first (already _1)
const images = fs.readdirSync(destDir)
    .filter(f => /\.(jpg|jpeg|JPG|JPEG)$/.test(f) && f !== 'cover.jpg')
    .sort((a, b) => {
        const numA = parseInt(a.match(/_(\d+)\./)?.[1] ?? '0');
        const numB = parseInt(b.match(/_(\d+)\./)?.[1] ?? '0');
        return numA - numB;
    })
    .map(f => \`/images/collections/\${albumId}/\${f}\`);

const newEntry = {
    id: albumId,
    title: '',
    description: '',
    coverImage: \`/images/collections/\${albumId}/cover.jpg\`,
    images
};

const data = JSON.parse(fs.readFileSync(collectionsFile, 'utf8'));

// Guard: don't add duplicates
if (data.collections.some(c => c.id === albumId)) {
    console.error('Warning: album ID ' + albumId + ' already exists in collections.json — skipping JSON update.');
    process.exit(0);
}

data.collections.unshift(newEntry);
fs.writeFileSync(collectionsFile, JSON.stringify(data, null, 2));

console.log('  Added ' + images.length + ' images. First image: ' + images[0]);
"

if [ $? -ne 0 ]; then
    echo "Error: Failed to update collections.json"
    exit 1
fi

echo ""
echo "✓ Done! Album '$ALBUM_ID' has been added."
echo ""
echo "Next steps:"
echo "  1. Open src/content/photography/collections.json"
echo "  2. Find the '$ALBUM_ID' entry at the top and fill in title and description"
echo "  3. Run: just dev"
