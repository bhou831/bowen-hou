import os
import json
import sys
from pathlib import Path

def generate_metadata(directory_path, dir_name):
    # Get all image files
    image_files = []
    for ext in ['.jpg', '.jpeg', '.JPG', '.JPEG']:
        image_files.extend(Path(directory_path).glob(f'*{ext}'))
    
    # Sort files to ensure consistent ordering
    image_files.sort()
    
    # Construct the metadata
    metadata = {
        "id": dir_name,
        "title": "",
        "description": "",
        "coverImage": f"/images/collections/{dir_name}/cover.jpg",
        "images": [
            f"/images/collections/{dir_name}/{file.name}"
            for file in image_files
            if file.name != "cover.jpg"
        ]
    }
    
    # Write to JSON file
    output_file = Path(directory_path) / f"{dir_name}_metadata.json"
    with open(output_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Metadata file generated: {output_file}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: generate_json.py <directory_path> <dir_name>")
        sys.exit(1)
    
    generate_metadata(sys.argv[1], sys.argv[2])