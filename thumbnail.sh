#!/bin/bash

# Input file
input="$1"
# Output file (add _thumb suffix)
output="${input%.*}_thumb.jpg"

# Generate thumbnail with max dimensions 700x500
ffmpeg -i "$input" \
    -vf "scale='if(gt(iw,ih),min(700,iw),-1)':if(gt(ih,iw),min(500,ih),-1)" \
    -quality 85 \
    "$output"