#!/usr/bin/env bash
#
# Extract version from a JSON manifest file
#
# Usage:
#   extract.sh <file_path> <key>
#
# Arguments:
#   file_path - Path to the JSON version file (e.g. .release-please-manifest.json)
#   key       - JSON key to extract (e.g. ".")
#
# Output:
#   Prints the extracted version to stdout
#
# Exit codes:
#   0 - Success
#   1 - Invalid arguments or file not found
#   2 - Failed to extract version (key missing or empty result)

set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Error: Invalid number of arguments" >&2
  echo "Usage: $0 <file_path> <key>" >&2
  exit 1
fi

FILE="$1"
KEY="$2"

if [ ! -f "$FILE" ]; then
  echo "Error: File not found: $FILE" >&2
  exit 1
fi

VERSION=$(jq -r --arg key "$KEY" '.[$key] // empty' "$FILE" 2>/dev/null || true)

if [ -z "$VERSION" ]; then
  echo "Error: Failed to extract version from $FILE using key '$KEY'" >&2
  exit 2
fi

echo "$VERSION"
