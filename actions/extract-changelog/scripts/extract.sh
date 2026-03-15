#!/usr/bin/env bash
#
# Extract changelog for a specific version from CHANGELOG.md
#
# Supports format: "1.19.0 (2026-02-25)" - version at start of line, date in parens
#
# Usage:
#   extract.sh <changelog_file> <version> <output_file>
#
# Arguments:
#   changelog_file - Path to CHANGELOG.md
#   version        - Version to extract (e.g. 1.19.0)
#   output_file    - Path for the extracted changelog output
#
# Exit codes:
#   0 - Success (output file written, may be empty if version not found)
#   1 - Invalid arguments

set -euo pipefail

if [ $# -ne 3 ]; then
  echo "Error: Invalid number of arguments" >&2
  echo "Usage: $0 <changelog_file> <version> <output_file>" >&2
  exit 1
fi

CHANGELOG_FILE="$1"
VERSION="$2"
OUTPUT_FILE="$3"

if [ -f "$CHANGELOG_FILE" ]; then
  awk -v ver="$VERSION" '
    # Format: "1.19.0 (2026-02-25)" - version at start, date in parens
    /^[0-9]+\.[0-9]+\.[0-9]+[^ ]* \(/ {
      if (found) exit
      if (index($0, ver " (") == 1) { found=1; print; next }
    }
    found { print }
  ' "$CHANGELOG_FILE" > "$OUTPUT_FILE"
else
  touch "$OUTPUT_FILE"
fi
