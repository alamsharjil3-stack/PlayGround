#!/usr/bin/env bash
# Build the static app and serve it in the foreground for the preview controller.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_DIR:-$SCRIPT_DIR}"
PORT="${PORT:-3000}"
WEB_DIR="${OPENCODE_WEB_DIR:-${RUNNER_TEMP:-/tmp}/omgithub-web}"
BUILD_DIR="$PROJECT_ROOT/dist"

cd "$PROJECT_ROOT"

echo "[start] project=$PROJECT_ROOT port=$PORT build=$BUILD_DIR"
/usr/bin/time -p mkdir -p "$WEB_DIR" "$BUILD_DIR"

# Publish deployment metadata outside source; the static bundle stays in PROJECT_DIR.
printf '{"project":"%s","directory":"%s"}\n' "$PROJECT_ROOT" "$BUILD_DIR" > "$WEB_DIR/deployment-output.json"
/usr/bin/time -p cat "$WEB_DIR/deployment-output.json"

if [[ ! -d node_modules ]]; then
  if [[ -f package-lock.json ]]; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
fi

/usr/bin/time -p npm run build

if [[ ! -f "$BUILD_DIR/index.html" ]]; then
  echo "[start] build output is missing $BUILD_DIR/index.html" >&2
  exit 1
fi

# Foreground preview server. Vite handles SPA fallback; no background watcher can
# transiently empty dist while the public readiness check is running.
exec /usr/bin/time -p node "$PROJECT_ROOT/node_modules/vite/bin/vite.js" preview \
  --host 0.0.0.0 --port "$PORT" --strictPort
