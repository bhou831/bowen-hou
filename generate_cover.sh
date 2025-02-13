#!/bin/bash
# generate_cover.sh - Script to generate cover images

# Function to display usage
usage() {
    echo "Usage: $0 -file <directory_path> -name <file_name>"
    echo "Example: $0 -file ./hk2025 -name hk25_1"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -file)
            DIR_PATH="$2"
            shift
            shift
            ;;
        -name)
            FILE_NAME="$2"
            shift
            shift
            ;;
        *)
            usage
            ;;
    esac
done

# Validate required arguments
if [ -z "$DIR_PATH" ] || [ -z "$FILE_NAME" ]; then
    usage
fi

# Convert to absolute path
DIR_PATH="$(cd "$(dirname "$DIR_PATH")" && pwd)/$(basename "$DIR_PATH")"

# Ensure directory exists
if [ ! -d "$DIR_PATH" ]; then
    echo "Error: Directory $DIR_PATH does not exist"
    exit 1
fi

# Change to the target directory
cd "$DIR_PATH" || exit 1

# Check if input file exists
input_file="${FILE_NAME}.jpg"
if [ ! -f "$input_file" ]; then
    input_file="${FILE_NAME}.JPG"
    if [ ! -f "$input_file" ]; then
        echo "Error: Cannot find ${FILE_NAME}.jpg or ${FILE_NAME}.JPG"
        exit 1
    fi
fi

# Generate cover
ffmpeg -i "$input_file" \
    -vf "scale=w=1920:h=1080:force_original_aspect_ratio=decrease" \
    -quality 85 \
    -y \
    "cover.jpg"

echo "Cover image generated successfully as cover.jpg"