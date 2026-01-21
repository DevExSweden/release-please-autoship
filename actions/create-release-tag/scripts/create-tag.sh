#!/usr/bin/env bash
#
# Compute, create, and push release tags
#
# Usage:
#   create-tag.sh <version> <mode>
#
# Arguments:
#   version - Release version (e.g. 1.6.0)
#   mode    - candidate | production
#
# Tag format:
#   candidate:  v{version}-candidate.{N}
#   production: v{version}

set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Usage: $0 <version> <mode>" >&2
  exit 1
fi

VERSION="$1"
MODE="$2"

case "$MODE" in
  candidate|production) ;;
  *)
    echo "Invalid mode '$MODE'. Valid: candidate | production" >&2
    exit 1
    ;;
esac

git fetch --tags

if [ "$MODE" = "production" ]; then
  TAG="v${VERSION}"

  if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "Error: Production tag already exists: $TAG" >&2
    exit 1
  fi

  echo "Creating production tag: $TAG"
  git tag "$TAG"
  git push origin "$TAG"

  echo "tag=$TAG" >> "$GITHUB_OUTPUT"
  exit 0
fi

PREFIX="v${VERSION}-candidate."
COUNT=$(git tag -l "${PREFIX}*" | wc -l | tr -d ' ')
NEXT=$((COUNT + 1))
TAG="${PREFIX}${NEXT}"

echo "Creating candidate tag: $TAG"

git tag "$TAG"
git push origin "$TAG"

echo "tag=$TAG" >> "$GITHUB_OUTPUT"
