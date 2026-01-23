#!/bin/bash
set -euo pipefail

# Script to get commit SHAs for current and base (previous) tags
# Outputs: current_sha and base_sha to GITHUB_OUTPUT

CURRENT_TAG="${1:-}"
PREVIOUS_TAG="${2:-}"
FALLBACK_SHA="${3:-}"

# Get SHA for current tag
if [ -n "$CURRENT_TAG" ]; then
  CURRENT_SHA=$(git rev-list -n 1 "$CURRENT_TAG" 2>/dev/null || echo "")
  if [ -n "$CURRENT_SHA" ]; then
    echo "current_sha=$CURRENT_SHA" >> "$GITHUB_OUTPUT"
    echo "Current tag: $CURRENT_TAG -> $CURRENT_SHA"
  else
    echo "current_sha=$FALLBACK_SHA" >> "$GITHUB_OUTPUT"
    echo "Current tag not found, using workflow SHA: $FALLBACK_SHA"
  fi
else
  echo "current_sha=$FALLBACK_SHA" >> "$GITHUB_OUTPUT"
  echo "No current tag, using workflow SHA: $FALLBACK_SHA"
fi

# Get SHA for base (previous) tag
if [ -n "$PREVIOUS_TAG" ]; then
  BASE_SHA=$(git rev-list -n 1 "$PREVIOUS_TAG" 2>/dev/null || echo "")
  if [ -n "$BASE_SHA" ]; then
    echo "base_sha=$BASE_SHA" >> "$GITHUB_OUTPUT"
    echo "Base tag: $PREVIOUS_TAG -> $BASE_SHA"
  else
    echo "base_sha=" >> "$GITHUB_OUTPUT"
    echo "Base tag not found"
  fi
else
  echo "base_sha=" >> "$GITHUB_OUTPUT"
  echo "No base tag specified"
fi

