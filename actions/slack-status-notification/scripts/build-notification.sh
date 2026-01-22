#!/usr/bin/env bash
#
# Build Slack notification payload with status-based formatting
#
# Usage:
#   build-notification.sh <status> <channel> <success_title> <failure_title> <fields_json> <success_footer> <failure_footer> <output_file>
#
# Security:
#   - Validates JSON input before processing
#   - Uses jq's --arg flag for safe string interpolation
#   - Exits on any jq processing errors
#   - Validates that FIELDS is a JSON object

set -euo pipefail

# Validate arguments
if [ $# -ne 8 ]; then
  echo "Error: Invalid number of arguments" >&2
  echo "Usage: $0 <status> <channel> <success_title> <failure_title> <fields_json> <success_footer> <failure_footer> <output_file>" >&2
  exit 1
fi

STATUS="$1"
CHANNEL="$2"
SUCCESS_TITLE="$3"
FAILURE_TITLE="$4"
FIELDS="$5"
SUCCESS_FOOTER="$6"
FAILURE_FOOTER="$7"
OUTPUT_FILE="$8"

# Validate that FIELDS is valid JSON
if ! echo "$FIELDS" | jq -e '.' >/dev/null 2>&1; then
  echo "Error: FIELDS parameter is not valid JSON" >&2
  echo "Received: $FIELDS" >&2
  exit 1
fi

# Validate that FIELDS is a JSON object (not array, string, etc.)
if ! echo "$FIELDS" | jq -e 'type == "object"' >/dev/null 2>&1; then
  echo "Error: FIELDS must be a JSON object" >&2
  echo "Received: $FIELDS" >&2
  exit 1
fi

if [ "$STATUS" = "success" ]; then
  ICON="✅"
  TITLE="$SUCCESS_TITLE"
  FOOTER="$SUCCESS_FOOTER"
else
  ICON="❌"
  TITLE="$FAILURE_TITLE"
  FOOTER="$FAILURE_FOOTER"
fi

MESSAGE_TEXT="${ICON} ${TITLE}"$'\n'

# Process fields with error handling and proper escaping
# Using -e flag to exit on error, and validating each entry
if ! FIELDS_OUTPUT=$(echo "$FIELDS" | jq -e -r 'to_entries | .[] | "\(.key): \(.value)"' 2>&1); then
  echo "Error: Failed to process FIELDS JSON" >&2
  echo "$FIELDS_OUTPUT" >&2
  exit 1
fi

while IFS= read -r line; do
  if [ -n "$line" ]; then
    MESSAGE_TEXT="${MESSAGE_TEXT}${line}"$'\n'
  fi
done <<< "$FIELDS_OUTPUT"

if [ -n "$FOOTER" ]; then
  MESSAGE_TEXT="${MESSAGE_TEXT}"$'\n'"${FOOTER}"
fi

if ! jq -n \
  --arg channel "$CHANNEL" \
  --arg text "$MESSAGE_TEXT" \
  '{
    channel: $channel,
    text: $text
  }' > "$OUTPUT_FILE" 2>/dev/null; then
  echo "Error: Failed to generate Slack payload JSON" >&2
  exit 1
fi

echo "Slack payload written to: $OUTPUT_FILE"
