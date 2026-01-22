#!/usr/bin/env bash
#
# Extract version from various file formats
#
# Usage:
#   extract.sh <file_path> <key> <format>
#
# Arguments:
#   file_path - Path to the version file
#   key       - Key/field name to extract (e.g. MARKETING_VERSION, VERSION_NAME)
#   format    - File format: xcconfig | properties | plist
#
# Output:
#   Prints the extracted version to stdout
#
# Exit codes:
#   0 - Success
#   1 - Invalid arguments or unsupported format
#   2 - Failed to extract version (empty result)

set -euo pipefail

if [ $# -ne 3 ]; then
  echo "Error: Invalid number of arguments" >&2
  echo "Usage: $0 <file_path> <key> <format>" >&2
  exit 1
fi

FILE="$1"
KEY="$2"
FORMAT="$3"

if [ ! -f "$FILE" ]; then
  echo "Error: File not found: $FILE" >&2
  exit 1
fi

extract_xcconfig() {
  local file="$1" key="$2"
  grep "^$key" "$file" | awk '{print $3}'
}

extract_properties() {
  local file="$1" key="$2"
  grep "^$key=" "$file" | cut -d= -f2 | xargs
}

extract_plist() {
  local file="$1" key="$2"
  plutil -extract "$key" raw -o - "$file"
}

# Extract version based on format
case "$FORMAT" in
  xcconfig)
    VERSION=$(extract_xcconfig "$FILE" "$KEY")
    ;;
  properties)
    VERSION=$(extract_properties "$FILE" "$KEY")
    ;;
  plist)
    VERSION=$(extract_plist "$FILE" "$KEY")
    ;;
  *)
    echo "Error: Unsupported version_format: $FORMAT" >&2
    echo "Supported formats: xcconfig, properties, plist" >&2
    exit 1
    ;;
esac

if [ -z "$VERSION" ]; then
  echo "Error: Failed to extract version from $FILE using key '$KEY' and format '$FORMAT'" >&2
  exit 2
fi

echo "$VERSION"
