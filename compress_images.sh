#!/bin/bash

# Check if an argument (prefix) is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <prefix>"
    echo "Example: $0 mountains"
    exit 1
fi

# Set the prefix from the first argument
PREFIX=$1

# Counter for naming
counter=1

# Loop through all jpg and jpeg files
for file in *.jpg *.jpeg *.JPG *.JPEG; do
    # Check if any matching files exist
    [ -e "$file" ] || continue
    
    # Get file extension
    ext="${file##*.}"
    
    # Create new filename
    new_filename="${PREFIX}_${counter}.${ext}"
    
    # Compress the image with quality 7 and save with new name
    ffmpeg -i "$file" vf "scale=6000:-1" "$new_filename"
    
    # Remove the original file
    rm "$file"
    
    # Increment counter
    ((counter++))
done

echo "Compression complete! Files renamed with prefix '${PREFIX}'."
