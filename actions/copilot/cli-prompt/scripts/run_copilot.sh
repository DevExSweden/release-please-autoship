#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat <<'USAGE'
Usage: run_copilot.sh -p <prompt_text> -o <output_file> [-t <timeout>]

Required:
  -p  Prompt text passed directly to the Copilot CLI
  -o  Path to the output file

Optional:
  -t  Timeout duration (default: 600s). Examples: 300s, 10m
USAGE
}

PROMPT_TEXT=""
OUTPUT_FILE=""
TIMEOUT_DURATION="600s"

while getopts ":p:o:t:h" opt; do
  case "${opt}" in
    p) PROMPT_TEXT="${OPTARG}" ;;
    o) OUTPUT_FILE="${OPTARG}" ;;
    t) TIMEOUT_DURATION="${OPTARG}" ;;
    h) usage; exit 0 ;;
    \?) echo "Error: Invalid option -${OPTARG}" >&2; usage; exit 2 ;;
    :)  echo "Error: Option -${OPTARG} requires an argument." >&2; usage; exit 2 ;;
  esac
done

if [[ -z "${PROMPT_TEXT}" || -z "${OUTPUT_FILE}" ]]; then
  echo "Error: -p <prompt_text> and -o <output_file> are required." >&2
  usage
  exit 2
fi

# Require authentication token for Copilot CLI
: "${GITHUB_TOKEN:?Error: GITHUB_TOKEN is not set. Copilot CLI authentication requires GITHUB_TOKEN.}"

# Forward termination signals to child processes
trap 'trap - SIGTERM SIGINT; kill -s SIGTERM -- -$$ 2>/dev/null || true' SIGTERM SIGINT

set +e
timeout --foreground --signal=TERM --kill-after=30s "${TIMEOUT_DURATION}" \
  copilot -p "${PROMPT_TEXT}" \
    --allow-tool 'shell(git)' \
    --deny-tool 'write' \
    > "${OUTPUT_FILE}" \
    2> >(tee /dev/stderr)
EXIT_CODE=$?
set -e

#clean up the output file from agent steps
RAW_FILE="${OUTPUT_FILE}.raw"
sed '/^● /d;/^✓ /d;/^[[:space:]]*\$/d;/^[[:space:]]*↪ /d' "${RAW_FILE}" > "${OUTPUT_FILE}"
rm -f "${RAW_FILE}"

# Write step output for GitHub Actions if available
if [[ -n "${GITHUB_OUTPUT:-}" && -f "${OUTPUT_FILE}" ]]; then
  {
    printf 'report<<EOF\n'
    cat -- "${OUTPUT_FILE}"
    printf '\nEOF\n'
  } >> "${GITHUB_OUTPUT}"
fi

echo "Copilot exit code: ${EXIT_CODE}"
exit "${EXIT_CODE}"
