#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.yml"
LOG_DIR="$SCRIPT_DIR/../.logs"
LOG_FILE="$LOG_DIR/network.log"

mkdir -p "$LOG_DIR"

# Check docker is installed
if ! command -v docker &>/dev/null; then
  echo "Error: docker is not installed or not in PATH." >&2
  exit 1
fi

# Check docker compose subcommand
if ! docker compose version &>/dev/null 2>&1; then
  echo "Error: docker compose subcommand not available. Install Docker Compose V2." >&2
  exit 1
fi

echo "Starting Stellar local network..."
docker compose -f "$COMPOSE_FILE" up -d

# Wait for RPC to respond (up to 30s)
echo "Waiting for Soroban RPC on localhost:8000..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8000/health &>/dev/null 2>&1; then
    echo "Stellar RPC is ready (took ${i}s)"
    CONTAINER_ID=$(docker compose -f "$COMPOSE_FILE" ps -q stellar-local 2>/dev/null || echo "")
    echo "Container ID: ${CONTAINER_ID:-unknown}"
    echo "RPC:    http://localhost:8000"
    echo "Friendbot: http://localhost:8001"
    exit 0
  fi
  sleep 1
done

echo "Error: Stellar RPC did not respond within 30s." >&2
echo "Check logs: docker compose -f $COMPOSE_FILE logs" >&2
exit 1
