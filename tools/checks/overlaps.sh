#!/bin/bash
# The overlap check: builds the web version, then walks every screen at four
# phone sizes (and once in English) looking for anything that overlaps, is cut
# off, or makes a setup screen scroll. Prints the findings; none means pass.
#
#   npm run check:overlaps          (takes about 20 minutes)
#   SIZES="390x844" npm run check:overlaps   (one size, about 4 minutes)
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT="${OUT:-/tmp/amakarita-checks}"
PORT="${PORT:-8765}"
SIZES="${SIZES:-390x844 375x560 360x520 360x640}"
mkdir -p "$OUT"

EXPO_OFFLINE=1 CI=1 npx expo export --platform web > "$OUT/export.log" 2>&1
python3 -m http.server "$PORT" --directory dist > /dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1

# Playwright comes with the cloud session's global tools (Chromium is preinstalled).
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
fail=0
run() {
  local tag="$1" w="$2" h="$3" lang="$4"
  OUT="$OUT" VW="$w" VH="$h" TAG="$tag" LANG2="$lang" URL="http://localhost:$PORT/" node tools/checks/overlaps.js > "$OUT/$tag.txt" 2>&1 || true
  local n
  n=$(grep -c 'OVERLAP\|CUT\|NEEDS SCROLL\|STEP FAILED' "$OUT/$tag.txt" || true)
  echo "$lang ${w}x${h}: $n findings, $(grep '^errors' "$OUT/$tag.txt" || echo 'no result')"
  grep 'OVERLAP\|CUT\|NEEDS SCROLL\|STEP FAILED' "$OUT/$tag.txt" | head -10 || true
  [ "$n" = "0" ] || fail=1
}
i=0
for s in $SIZES; do i=$((i+1)); run "rw$i" "${s%x*}" "${s#*x}" rw; done
run en 360 640 en
echo "Screenshots: $OUT"
exit $fail
