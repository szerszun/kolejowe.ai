#!/bin/bash
# Weekly overnight run of the history ("Historia" tab) verification agent
# (all 86 lines). Invoked by cron (see `crontab -l`). Mirrors weekly-sync.sh
# -- see that file for the server-start/stop rationale.
set -uo pipefail

export PATH="/opt/homebrew/bin:$PATH"

cd "$(dirname "$0")/.."

LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/agent-verify-history.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >>"$LOG_FILE"
}

is_up() {
  [ "$(curl -s -o /dev/null -w '%{http_code}' 'http://localhost:3000/api/lines?limit=0' 2>/dev/null)" = "200" ]
}

log "=== weekly history-verify agent job starting ==="

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
  log "ERROR: Payload server did not become ready in time, aborting verification."
  if [ "$STARTED_SERVER" = "1" ]; then
    kill "$SERVER_PID" 2>/dev/null
  fi
  log "=== weekly history-verify agent job finished (aborted) ==="
  exit 1
fi

log "Running full history verification (--all, 86 lines, sequential against the OpenAI API)..."
npm run agent:verify-history:all >>"$LOG_FILE" 2>&1
SYNC_EXIT=$?
log "Verification finished with exit code $SYNC_EXIT"

if [ "$STARTED_SERVER" = "1" ]; then
  log "Stopping server this script started (pid $SERVER_PID)..."
  kill "$SERVER_PID" 2>/dev/null
fi

log "=== weekly history-verify agent job finished ==="
exit "$SYNC_EXIT"
