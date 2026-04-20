#!/bin/bash
set -euo pipefail

# Script to get commit SHAs for current and base (previous) tags
# Outputs: current_sha and base_sha to GITHUB_OUTPUT

CURRENT_TAG="${1:-}"
PREVIOUS_TAG="${2:-}"
FALLBACK_SHA="${3:-}"

# Get SHA for current tag
RESOLVED_CURRENT_SHA=""
if [ -n "$CURRENT_TAG" ]; then
  RESOLVED_CURRENT_SHA=$(git rev-list -n 1 "$CURRENT_TAG" 2>/dev/null || echo "")
  if [ -z "$RESOLVED_CURRENT_SHA" ]; then
    echo "Error: given current tag '$CURRENT_TAG' not found" >&2
    exit 1
  fi
  echo "Current tag: $CURRENT_TAG -> $RESOLVED_CURRENT_SHA"
else
  RESOLVED_CURRENT_SHA="$FALLBACK_SHA"
  echo "No current tag, using workflow SHA: $FALLBACK_SHA"
fi

echo "current_sha=$RESOLVED_CURRENT_SHA" >> "$GITHUB_OUTPUT"

# Get SHA for base (previous) tag
if [ -n "$PREVIOUS_TAG" ]; then
  BASE_SHA=$(git rev-list -n 1 "$PREVIOUS_TAG" 2>/dev/null || echo "")
  if [ -n "$BASE_SHA" ]; then
    echo "base_sha=$BASE_SHA" >> "$GITHUB_OUTPUT"
    echo "Base tag: $PREVIOUS_TAG -> $BASE_SHA"
  else
    echo "Error: given previous tag '$PREVIOUS_TAG' not found" >&2
    exit 1
  fi
else
  FALLBACK_PREVIOUS_TAG=$(git describe --tags --abbrev=0 "${RESOLVED_CURRENT_SHA}^" 2>/dev/null || echo "")
  if [ -n "$FALLBACK_PREVIOUS_TAG" ]; then
    BASE_SHA=$(git rev-list -n 1 "$FALLBACK_PREVIOUS_TAG" 2>/dev/null || echo "")
    echo "base_sha=$BASE_SHA" >> "$GITHUB_OUTPUT"
    echo "No base tag specified, falling back to latest tag: $FALLBACK_PREVIOUS_TAG -> $BASE_SHA"
  else
    echo "base_sha=" >> "$GITHUB_OUTPUT"
    echo "No base tag specified and no previous tag found"
  fi
fi

