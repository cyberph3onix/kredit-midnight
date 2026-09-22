#!/usr/bin/env bash
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Pick a Node version manager if one is available; otherwise rely on PATH.
if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env 2>/dev/null)"
elif [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  . "$NVM_DIR/nvm.sh"
  nvm use default >/dev/null 2>&1 || true
fi

echo "=== Starting Kredit Protocol Services ==="

cleanup() {
  trap - INT TERM
  [ -n "${ZK_PID:-}" ] && kill "$ZK_PID" 2>/dev/null
  [ -n "${FE_PID:-}" ] && kill "$FE_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

# Kill any existing processes on our ports
lsof -ti:3100 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 1

# Start ZK artifacts server
echo "[1/2] Starting ZK artifacts server on port 3100..."
node "$SCRIPT_DIR/frontend/zk-server.js" &
ZK_PID=$!
sleep 2

# Start frontend dev server
echo "[2/2] Starting frontend on port 3000..."
cd "$SCRIPT_DIR/frontend"
npx next dev --port 3000 &
FE_PID=$!
sleep 5

echo ""
echo "=== All Services Running ==="
echo "  Frontend:     http://localhost:3000"
echo "  ZK Artifacts: http://localhost:3100"
echo ""
echo "Open http://localhost:3000/issuer to deploy the contract."
echo "Press Ctrl+C to stop all services."

wait