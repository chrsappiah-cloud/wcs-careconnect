#!/usr/bin/env bash
set -euo pipefail

npm --prefix apps/backend start &
BACKEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

npm --prefix apps/mobile run ios
