# Justfile for deploying a photo blog to AWS S3

# Add a new photo collection
# Usage: just add-album --path <folder_name> --cover <filename.jpg> [--name <album_id>]
# Example: just add-album --path tokyo2025 --cover 1.jpg
add-album *args:
    ./scripts/add-album.sh {{args}}

# Find existing photos over 4000px; pass --apply to resize them in place
cap-photo-edge *args:
    ./scripts/cap-photo-edge.sh {{args}}

# Create an optimized atlas copy without modifying the source photograph
# Usage: just add-mountain-photo --id <entry-id> --source <path>
add-mountain-photo *args:
    ./scripts/add-mountain-photo.sh {{args}}

dev:
    - npm run dev
    - open http://localhost:3000/

deploy:
    - export NODE_OPTIONS=--no-experimental-fetch
    - rm -rf ./out
    - npm run build
    - aws s3 sync ./out/ s3://bowen-hou.com --delete --exclude "images/*"

# Sync images to S3 — run once after just add-album
sync-images:
    aws s3 sync ./public/images/ s3://bowen-hou.com/images/ --delete

# Remove Turbopack build cache (speeds up next dev if cache is stale)
clean-cache:
    rm -rf .next/cache .next-dev/cache
    @echo "Cache cleared"

# Full clean — removes all build artifacts including the cache
clean:
    rm -rf .next .next-dev out
    @echo "Build artifacts cleared"

# Install dependencies
install:
    npm install

# Format source files with prettier
format:
    npm run format
