#!/bin/bash

# Input file
input="$1"
# Output file (add _thumb suffix)
output="${input%.*}_thumb.jpg"

# Generate thumbnail with max dimensions 700x500
ffmpeg -i "$input" \
    -vf "scale=w=1920:h=1080:force_original_aspect_ratio=decrease" \
    -quality 85 \
    -y \
    "$output"