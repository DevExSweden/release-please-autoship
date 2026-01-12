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

# Marker + instructions we inject into the prompt to be able to extract the final report content
MARKER="**********"

MARKER_INSTRUCTIONS=$'\n\n## OUTPUT FORMAT (STRICT)\n\n'\
'1. You must follow this output format strictly in addition to the prompt text.\n'\
'2. First, output exactly this line on its own line:\n'\
"${MARKER}"$'\n'\
'3. At the very end of your output, output exactly the same marker line again on its own line.\n'\
'4. Do NOT output the marker line anywhere else.\n'

PROMPT_TEXT_WITH_MARKER="${PROMPT_TEXT}${MARKER_INSTRUCTIONS}"

# Require authentication token for Copilot CLI
: "${GITHUB_TOKEN:?Error: GITHUB_TOKEN is not set. Copilot CLI authentication requires GITHUB_TOKEN.}"

# Forward termination signals to child processes
trap 'trap - SIGTERM SIGINT; kill -s SIGTERM -- -$$ 2>/dev/null || true' SIGTERM SIGINT

RAW_FILE="${OUTPUT_FILE}.raw"

set +e
timeout --foreground --signal=TERM --kill-after=30s "${TIMEOUT_DURATION}" \
  copilot -p "${PROMPT_TEXT_WITH_MARKER}" \
    --allow-tool 'shell(git)' \
    --deny-tool 'write' \
    > "${RAW_FILE}" \
    2> >(tee /dev/stderr)
EXIT_CODE=$?
set -e

# Clean output: keep only lines BETWEEN the first and second marker (or everything after the first if second is missing)
if grep -qxF "${MARKER}" "${RAW_FILE}"; then
  awk -v marker="${MARKER}" '
    $0 == marker {
      if (found) { exit }   # second marker: stop printing
      found=1               # first marker: start printing
      next
    }
    found { print }
  ' "${RAW_FILE}" > "${OUTPUT_FILE}"
else
  echo "Warning: marker '"${MARKER}"' not found in Copilot output. Using full raw output." >&2
  cp "${RAW_FILE}" "${OUTPUT_FILE}"
fi

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
