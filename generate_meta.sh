#!/bin/bash
# generate_meta.sh - Main script for image processing and metadata generation

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to display usage
usage() {
    echo "Usage: $0 -path <directory_path> -name <prefix_name>"
    echo "Example: $0 -path ./zhima_2025 -name zhima25"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -path)
            DIR_PATH="$2"
            shift
            shift
            ;;
        -name)
            PREFIX_NAME="$2"
            shift
            shift
            ;;
        *)
            usage
            ;;
    esac
done

# Validate required arguments
if [ -z "$DIR_PATH" ] || [ -z "$PREFIX_NAME" ]; then
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

# Run the image compression directly in the directory
counter=1
for file in *.jpg *.jpeg *.JPG *.JPEG; do
    # Check if any matching files exist
    [ -e "$file" ] || continue
    
    # Get file extension
    ext="${file##*.}"
    
    # Create new filename
    new_filename="${PREFIX_NAME}_${counter}.${ext}"
    
    # Compress the image with quality 7 and save with new name
    ffmpeg -i "$file" -vf "scale=4000:-1" "$new_filename"
    
    # Remove the original file
    rm "$file"
    
    # Increment counter
    ((counter++))
done

# Generate metadata using Python script
DIR_NAME=$(basename "$DIR_PATH")
python3 "${SCRIPT_DIR}/generate_json.py" "$DIR_PATH" "$DIR_NAME"

echo "Processing complete! Images compressed and metadata generated."