#!/usr/bin/env bash
set -euo pipefail

RPC_PORT=8899

echo "Stopping Solana local validator..."

# Try to kill by port
pid=$(lsof -ti :$RPC_PORT 2>/dev/null || true)
if [[ -n "$pid" ]]; then
  kill "$pid" 2>/dev/null || true
  echo "Killed process on port $RPC_PORT (PID: $pid)"
fi

# Fallback: pkill by process name
pkill -f "solana-test-validator" 2>/dev/null && echo "Killed solana-test-validator process" || true

echo "Solana local validator stopped."
