#!/bin/bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 22

echo "=== Starting Kredit Protocol Services ==="

# Kill any existing processes on our ports
lsof -ti:3100 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start ZK artifacts server
echo "[1/3] Starting ZK artifacts server on port 3100..."
node "$SCRIPT_DIR/frontend/zk-server.js" &
ZK_PID=$!
sleep 2

# Start frontend dev server
echo "[2/3] Starting frontend on port 3000..."
cd "$SCRIPT_DIR/frontend"
npx next dev --port 3000 &
FE_PID=$!
sleep 5

# Check proof server
echo "[3/3] Checking proof server on port 6300..."
if curl -s -o /dev/null http://localhost:6300 2>/dev/null; then
  echo "  Proof server: OK"
else
  echo "  Proof server: Starting docker..."
  docker run -d -p 6300:6300 midnightnetwork/proof-server:8.1.0 2>/dev/null
  sleep 5
fi

echo ""
echo "=== All Services Running ==="
echo "  Frontend:     http://localhost:3000"
echo "  ZK Artifacts: http://localhost:3100"
echo "  Proof Server: http://localhost:6300"
echo ""
echo "Open http://localhost:3000/issuer to deploy the contract."
echo "Press Ctrl+C to stop all services."

# Wait and keep alive
wait
