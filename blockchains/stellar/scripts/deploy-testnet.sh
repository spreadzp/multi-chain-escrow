#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STELLAR_DIR="$SCRIPT_DIR/.."
KEYS_DIR="$STELLAR_DIR/.local-keys"
DEPLOYER_KEY="$KEYS_DIR/deployer.json"
WASM_FILE="${CARGO_TARGET_DIR:-/home/dev/solana_build_target}/wasm32v1-none/release/escrow.wasm"
TESTNET_RPC="https://soroban-testnet.stellar.org"
FRIENDBOT_URL="https://friendbot.stellar.org"

echo "=== Stellar Escrow — Testnet Deployment ==="
echo ""

# Check stellar CLI
if ! command -v stellar &>/dev/null; then
  echo "Error: stellar CLI is not installed." >&2
  exit 1
fi

# Check deployer key
if [[ ! -f "$DEPLOYER_KEY" ]]; then
  echo "Error: Deployer key not found at $DEPLOYER_KEY" >&2
  echo "Run 'npm run chain:stellar:faucet' first to generate keys." >&2
  exit 1
fi

DEPLOYER_PK=$(python3 -c "import json; print(json.load(open('$DEPLOYER_KEY'))['publicKey'])" | tr -d '\n')
DEPLOYER_SK=$(python3 -c "import json; print(json.load(open('$DEPLOYER_KEY'))['secretKey'])" | tr -d '\n')
echo "Deployer: $DEPLOYER_PK"

# Fund via friendbot if needed
echo "Funding deployer via friendbot..."
curl -sf "$FRIENDBOT_URL/?addr=$DEPLOYER_PK" >/dev/null 2>&1 && echo "Funded." || echo "Already funded or rate-limited."

# Check testnet connectivity
echo "Checking testnet connectivity..."
if ! stellar network ls 2>/dev/null | grep -q testnet; then
  echo "Error: testnet network not configured in stellar CLI" >&2
  exit 1
fi
echo "Testnet is reachable."

# Build the contract
echo ""
echo "Building escrow contract..."
cd "$STELLAR_DIR"
stellar contract build --profile release

# Check wasm exists
if [[ ! -f "$WASM_FILE" ]]; then
  echo "Error: WASM file not found at $WASM_FILE" >&2
  echo "Try setting CARGO_TARGET_DIR env var if build output is elsewhere." >&2
  exit 1
fi

echo "WASM: $WASM_FILE ($(wc -c < "$WASM_FILE") bytes)"

# Deploy to testnet
echo ""
echo "Deploying to testnet..."
CONTRACT_ID=$(stellar contract deploy \
  --source "$DEPLOYER_SK" \
  --wasm "$WASM_FILE" \
  --network testnet \
  2>&1)

echo "$CONTRACT_ID"

# Extract the contract ID (starts with C)
CONTRACT_ADDR=$(echo "$CONTRACT_ID" | grep -oE 'C[A-Z0-9]{55}' | head -1)

if [[ -z "$CONTRACT_ADDR" ]]; then
  echo "Error: Could not extract contract ID from output" >&2
  exit 1
fi

echo ""
echo "=== Deployment Complete ==="
echo "Contract ID: $CONTRACT_ADDR"
echo "Network: testnet ($TESTNET_RPC)"
echo "Explorer: https://stellar.expert/explorer/testnet/contract/$CONTRACT_ADDR"
echo ""
echo "Next steps:"
echo "  1. Run create-testnet-sac.ts to create SAC token"
echo "  2. Update fe/src/config/contracts.ts with the contract ID and token address"
