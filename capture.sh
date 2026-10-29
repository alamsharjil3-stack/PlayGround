#!/usr/bin/env bash
# Capture desktop and mobile screenshots of the exact preview URL.
set -euo pipefail

: "${CAPTURE_URL:?Set CAPTURE_URL to the preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to an output directory outside the source tree}"
RUNTIME_DIR="${RUNTIME_DIR:-/home/runner/work/_temp/omgithub-runtime}"
CAPTURE_SCRIPT="$RUNTIME_DIR/scripts/default-capture.mjs"

echo "[capture] url=$CAPTURE_URL output=$CAPTURE_DIR"
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"

if [[ ! -f "$CAPTURE_SCRIPT" ]]; then
  echo "[capture] runtime capture script not found: $CAPTURE_SCRIPT" >&2
  exit 1
fi

# Wait for the mounted app, not just an empty body. The runtime helper then waits
# for fonts, performs any configured auto-start, and writes both screenshots.
export CAPTURE_READY_SELECTOR="${CAPTURE_READY_SELECTOR:-#root > :first-child:not(.toast-stack)}"

set +e
/usr/bin/time -p node "$CAPTURE_SCRIPT"
status=$?
set -e

echo "[capture] exit=$status"
exit "$status"
