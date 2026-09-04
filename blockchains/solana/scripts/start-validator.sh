#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/../.logs"
LOG_FILE="$LOG_DIR/validator.log"
RPC_PORT=8899

# Check solana CLI is installed
if ! command -v solana &>/dev/null; then
  echo "Error: solana CLI is not installed or not in PATH." >&2
  echo "Install: sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\"" >&2
  exit 1
fi

if ! command -v solana-test-validator &>/dev/null; then
  echo "Error: solana-test-validator is not installed or not in PATH." >&2
  echo "Install: sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\"" >&2
  exit 1
fi

mkdir -p "$LOG_DIR"

# Kill any existing validator on port 8899
existing_pid=$(lsof -ti :$RPC_PORT 2>/dev/null || true)
if [[ -n "$existing_pid" ]]; then
  echo "Killing existing process on port $RPC_PORT (PID: $existing_pid)..."
  kill "$existing_pid" 2>/dev/null || true
  sleep 1
fi

# Also try pkill as fallback for solana-test-validator
pkill -f "solana-test-validator.*--rpc-port $RPC_PORT" 2>/dev/null || true
sleep 0.5

echo "Starting Solana local validator on localhost:$RPC_PORT..."
solana-test-validator --rpc-port $RPC_PORT --reset --clone-feature-set --url https://api.mainnet-beta.solana.com > "$LOG_FILE" 2>&1 &
VALIDATOR_PID=$!

# Wait for RPC to respond (up to 15s)
echo "Waiting for Solana RPC on localhost:$RPC_PORT..."
for i in $(seq 1 15); do
  if solana cluster-version --url http://localhost:$RPC_PORT &>/dev/null 2>&1; then
    echo "Solana RPC is ready (took ${i}s)"
    echo "PID:      $VALIDATOR_PID"
    echo "RPC:      http://localhost:$RPC_PORT"
    echo "Logs:     $LOG_FILE"
    exit 0
  fi
  sleep 1
done

echo "Error: Solana RPC did not respond within 15s." >&2
echo "Check logs: $LOG_FILE" >&2
exit 1
