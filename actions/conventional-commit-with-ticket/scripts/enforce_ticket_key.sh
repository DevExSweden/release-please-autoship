#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <pr-title>"
  exit 1
fi

PR_TITLE="$1"

# If no pattern is configured, skip ticket validation entirely
if [[ -z "${TICKET_KEY_PATTERN:-}" ]]; then
  echo "No ticket key pattern configured. Skipping ticket validation."
  exit 0
fi

# Comma-separated types that require a ticket key (e.g. "feat,fix,perf,security,refactor")
REQUIRED_TYPES="${REQUIRE_TICKET_FOR_TYPES:-feat,fix,perf,security,refactor}"

TYPE_PART="${PR_TITLE%%:*}"
TYPE="${TYPE_PART%%(*}"
TYPE="${TYPE// /}"  # remove spaces

echo "PR title: $PR_TITLE"
echo "Detected type: $TYPE"
echo "Ticket key pattern: $TICKET_KEY_PATTERN"
echo "Types requiring a ticket: $REQUIRED_TYPES"

# Check if the detected type is in the required list
if echo "$REQUIRED_TYPES" | tr ',' '\n' | grep -qx "$TYPE"; then
  echo "Ticket key is required for type '$TYPE'."
  if echo "$PR_TITLE" | grep -Eq "$TICKET_KEY_PATTERN"; then
    echo "Ticket key found. ✅"
    exit 0
  else
    echo "❌ Missing valid ticket key in PR title."
    echo "Expected a key matching: $TICKET_KEY_PATTERN"
    exit 1
  fi
else
  echo "Ticket key is NOT required for type '$TYPE'. Skipping ticket validation."
  exit 0
fi
