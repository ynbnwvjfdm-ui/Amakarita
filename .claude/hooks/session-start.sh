#!/bin/bash
# Runs when a Claude Code session starts. In a cloud session the project is a
# fresh clone without its packages: install them, so tests, lint, the web
# build and `npm run phone` work straight away. Safe to run again.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"
npm install --no-audit --no-fund
