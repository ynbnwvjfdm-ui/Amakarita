#!/bin/bash
# Runs the app on the author's iPhone through Expo Go, from a Claude Code cloud session.
#
#   npm run phone
#
# Starts the Expo dev server with Expo's account tunnel. The server registers
# with the Expo account in EXPO_TOKEN, so "Amakarita" appears in Expo Go under
# Home > Development servers (signed in as the same account); the exp:// link
# it prints works too. It keeps running until stopped: in a cloud session,
# run it as a background job, and note the container stops when idle.
#
# One-time setup, already done for the author's "Default" environment:
#   - Network access "Custom", allowing: expo.dev, *.expo.dev, exp.host,
#     *.exp.host, *.expo.app, storage.googleapis.com
#   - Environment variable EXPO_TOKEN (an Expo access token)
#   - Expo Go on the phone, signed in to the same Expo account
set -euo pipefail
cd "$(dirname "$0")/../.."

LOG="${PHONE_LOG:-/tmp/amakarita-phone.log}"

if [ -z "${EXPO_TOKEN:-}" ]; then
  echo "EXPO_TOKEN is not set: add it to this cloud environment's variables (see HANDOFF.md)." >&2
  exit 1
fi
[ -d node_modules ] || npm install

# Expo skips registering with the account (the "Development servers" list) when CI or EXPO_OFFLINE is set.
unset CI EXPO_OFFLINE

# The tunnel is a websocket, which the cloud proxy does not officially support:
# it works, but can drop (seen after about 30 minutes), and Expo then exits. So
# start it again after a pause long enough for Expo to free the old tunnel.
# Each restart gets a new link; the "Development servers" entry follows it.
run_expo() {
  NODE_OPTIONS="--require $PWD/tools/phone/ws-proxy.cjs ${NODE_OPTIONS:-}" \
  NODE_USE_ENV_PROXY=1 \
  EXPO_UNSTABLE_TUNNEL_V2=1 \
  DEBUG=expo:start:server:ws-tunnel,expo:start:server:developmentSession \
    npx expo start --tunnel --port 8081 < /dev/null 2>&1 | while IFS= read -r line; do
      printf '%s %s\n' "$(date -u +%H:%M:%S)" "$line"
      case "$line" in
        *"Development session ping"*url:*)
          url="${line##*url: }"; url="${url%)}"
          echo "READY: open Expo Go > Home > Development servers > Amakarita, or this link: $url"
          ;;
      esac
    done | tee -a "$LOG" || true
}

: > "$LOG"
quick=0
while :; do
  echo "Starting Expo with the tunnel; log: $LOG" | tee -a "$LOG"
  started=$(date +%s)
  run_expo
  # Three failures in a row within a minute and a half each: something else is wrong (stop, see the log).
  if [ $(( $(date +%s) - started )) -lt 90 ]; then quick=$((quick + 1)); else quick=0; fi
  if [ "$quick" -ge 3 ]; then
    echo "STOPPED: Expo failed to start three times in a row; see $LOG." | tee -a "$LOG"
    exit 1
  fi
  echo "RESTARTING: the tunnel dropped; starting again in 30 seconds (the link will change)." | tee -a "$LOG"
  sleep 30
done
