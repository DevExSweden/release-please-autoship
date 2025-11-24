#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <pr-title>"
  exit 1
fi

PR_TITLE="$1"

# Fixed ticket pattern: POSS-123, PS-456, BUGS-789, COM-42, PROM-1337
TICKET_KEY_PATTERN='(POSS|PS|BUGS|COM|PROM|APPE)-[0-9]{2,5}'

TYPE_PART="${PR_TITLE%%:*}"     
TYPE="${TYPE_PART%%(*}"          
TYPE="${TYPE// /}"       # remove spaces

echo "PR title: $PR_TITLE"
echo "Detected type: $TYPE"

case "$TYPE" in feat|fix|perf|security|refactor)
    echo "Ticket key is required for type '$TYPE'. Pattern: $TICKET_KEY_PATTERN"
    if echo "$PR_TITLE" | grep -Eq "$TICKET_KEY_PATTERN"; then
      echo "Ticket key found. ✅"
      exit 0
    else
      echo "❌ Missing valid ticket key in PR title."
      echo "Expected something like: POSS-123, PS-456, BUGS-789, COM-42, PROM-1337"
      exit 1
    fi
    ;;

  # docs, test, chore, wip, revert,ci, etc. don't require a ticket
  *)
    echo "Ticket key is NOT required for type '$TYPE'. Skipping ticket validation."
    exit 0
    ;;
esac
