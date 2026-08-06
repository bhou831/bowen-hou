#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "Usage: $0 --id <entry-id> --source <image-path>" >&2
}

entry_id=""
source_path=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --id)
      [[ $# -ge 2 ]] || { usage; exit 1; }
      entry_id="$2"
      shift 2
      ;;
    --source)
      [[ $# -ge 2 ]] || { usage; exit 1; }
      source_path="$2"
      shift 2
      ;;
    *)
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$entry_id" || -z "$source_path" ]]; then
  usage
  exit 1
fi

if [[ ! "$entry_id" =~ ^[A-Za-z0-9][A-Za-z0-9_-]*$ ]]; then
  echo "Entry ID may only contain letters, numbers, underscores, and hyphens." >&2
  exit 1
fi

if [[ ! -f "$source_path" ]]; then
  echo "Source photograph does not exist: $source_path" >&2
  exit 1
fi

command -v ffmpeg >/dev/null 2>&1 || {
  echo "ffmpeg is required." >&2
  exit 1
}

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "$script_directory/.." && pwd)"
output_directory="$project_root/public/images/mountains"
output_path="$output_directory/$entry_id.jpg"

mkdir -p "$output_directory"
if [[ -e "$output_path" ]]; then
  echo "Refusing to overwrite existing photograph: $output_path" >&2
  exit 1
fi

temporary_directory="$(mktemp -d "$output_directory/.${entry_id}.XXXXXX")"
temporary_path="$temporary_directory/output.jpg"
trap 'rm -f "$temporary_path"; rmdir "$temporary_directory"' EXIT

ffmpeg -hide_banner -loglevel error -y -i "$source_path" \
  -map_metadata -1 \
  -vf "scale=w='min(iw,1414)':h='min(ih,1414)':force_original_aspect_ratio=decrease:force_divisible_by=2" \
  -frames:v 1 \
  -q:v 3 \
  "$temporary_path"

mv "$temporary_path" "$output_path"
rmdir "$temporary_directory"
trap - EXIT
echo "Created ${output_path#$project_root/}"
