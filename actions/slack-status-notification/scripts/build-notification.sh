#!/usr/bin/env bash
#
# Build Slack notification payload with status-based formatting
#
# Usage:
#   build-notification.sh <status> <channel> <success_title> <failure_title> <fields_json> <success_footer> <failure_footer> <output_file>

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

while IFS= read -r line; do
  if [ -n "$line" ]; then
    MESSAGE_TEXT="${MESSAGE_TEXT}${line}"$'\n'
  fi
done < <(echo "$FIELDS" | jq -r 'to_entries | .[] | "\(.key): \(.value)"')

if [ -n "$FOOTER" ]; then
  MESSAGE_TEXT="${MESSAGE_TEXT}"$'\n'"${FOOTER}"
fi

jq -n \
  --arg channel "$CHANNEL" \
  --arg text "$MESSAGE_TEXT" \
  '{
    channel: $channel,
    text: $text
  }' > "$OUTPUT_FILE"

echo "Slack payload written to: $OUTPUT_FILE"

