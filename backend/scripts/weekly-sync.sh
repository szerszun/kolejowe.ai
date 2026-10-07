#!/bin/bash
# Weekly overnight run of the line-sync agent (all 86 lines). Invoked by
# cron (see `crontab -l`), not meant to be run concurrently with itself --
# cron's own serialization (one weekly tick) is enough.
#
# The agent job talks to Payload over REST (http://localhost:3000), so this
# script starts the dev server itself if nothing is already listening there,
# runs the sync, then stops only the server it started -- it never kills a
# server that was already running (e.g. one left up from interactive work).
set -uo pipefail

export PATH="/opt/homebrew/bin:$PATH"

cd "$(dirname "$0")/.."

LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/agent-sync.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >>"$LOG_FILE"
}

is_up() {
  [ "$(curl -s -o /dev/null -w '%{http_code}' 'http://localhost:3000/api/lines?limit=0' 2>/dev/null)" = "200" ]
}

log "=== weekly line-sync agent job starting ==="

STARTED_SERVER=0
SERVER_PID=""

if ! is_up; then
  log "Payload server not running, starting it..."
  npm run dev >>"$LOG_FILE" 2>&1 &
  SERVER_PID=$!
  STARTED_SERVER=1

  for _ in $(seq 1 30); do
    is_up && break
    sleep 2
  done
fi

if ! is_up; then
  log "ERROR: Payload server did not become ready in time, aborting sync."
  if [ "$STARTED_SERVER" = "1" ]; then
    kill "$SERVER_PID" 2>/dev/null
  fi
  log "=== weekly line-sync agent job finished (aborted) ==="
  exit 1
fi

log "Running full line sync (--all, 86 lines, sequential against Overpass)..."
npm run agent:sync:all >>"$LOG_FILE" 2>&1
SYNC_EXIT=$?
log "Sync finished with exit code $SYNC_EXIT"

if [ "$STARTED_SERVER" = "1" ]; then
  log "Stopping server this script started (pid $SERVER_PID)..."
  kill "$SERVER_PID" 2>/dev/null
fi

log "=== weekly line-sync agent job finished ==="
exit "$SYNC_EXIT"
