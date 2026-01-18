#!/usr/bin/env bash
#
# Compute monotonic build number based on git commit count
#
# Usage:
#   compute-build-number.sh <base_number>
#
# Arguments:
#   base_number - Base number to add to commit count (default: 1000)

set -euo pipefail

BASE="${1:-1000}"

# Ensure we have full history
git fetch --prune --unshallow 2>/dev/null || true

# Count commits
COUNT=$(git rev-list --count HEAD)

# Compute build number
BUILD_NUMBER=$((BASE + COUNT))

echo "Commit count: $COUNT"
echo "Base number: $BASE"
echo "Build number: $BUILD_NUMBER"

# Output build number
echo "build_number=$BUILD_NUMBER" >> "$GITHUB_OUTPUT"

