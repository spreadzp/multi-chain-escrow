#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOLANA_DIR="$SCRIPT_DIR/.."
DEPLOYER_KEY="$SOLANA_DIR/.local-keys/deployer-anchor.json"
DEVNET_URL="https://api.devnet.solana.com"

echo "=== Solana Escrow — Devnet Deployment ==="
echo ""

# Check solana CLI
if ! command -v solana &>/dev/null; then
  echo "Error: solana CLI is not installed." >&2
  exit 1
fi

if ! command -v anchor &>/dev/null; then
  echo "Error: anchor CLI is not installed." >&2
  exit 1
fi

# Check deployer keypair
if [[ ! -f "$DEPLOYER_KEY" ]]; then
  echo "Error: Deployer keypair not found at $DEPLOYER_KEY" >&2
  echo "Run 'npm run chain:solana:faucet' first to generate keys." >&2
  exit 1
fi

DEPLOYER_PUBKEY=$(solana-keygen pubkey "$DEPLOYER_KEY" 2>/dev/null)
echo "Deployer: $DEPLOYER_PUBKEY"

# Check devnet connectivity
echo "Checking devnet connectivity..."
if ! solana cluster-version --url "$DEVNET_URL" &>/dev/null 2>&1; then
  echo "Error: Cannot reach Solana devnet at $DEVNET_URL" >&2
  exit 1
fi
echo "Devnet is reachable."

# Check deployer balance
BALANCE=$(solana balance "$DEPLOYER_PUBKEY" --url "$DEVNET_URL" 2>/dev/null || echo "0 SOL")
echo "Deployer balance: $BALANCE"

# Airdrop if needed (devnet limit: 5 SOL per request, 20 SOL per day)
if [[ "$BALANCE" == "0 SOL" ]]; then
  echo "Airdropping 5 SOL to deployer..."
  solana airdrop 5 "$DEPLOYER_PUBKEY" --url "$DEVNET_URL" || {
    echo "Error: Airdrop failed. Try again later or use a funded account." >&2
    exit 1
  }
  sleep 3
  BALANCE=$(solana balance "$DEPLOYER_PUBKEY" --url "$DEVNET_URL" 2>/dev/null)
  echo "Deployer balance: $BALANCE"
fi

# Build the program
echo ""
echo "Building escrow program..."
cd "$SOLANA_DIR"
anchor build

# Deploy to devnet
echo ""
echo "Deploying to devnet..."
anchor deploy --provider.cluster devnet --provider.wallet "$DEPLOYER_KEY"

# Get deployed program ID
PROGRAM_ID=$(anchor keys list 2>/dev/null | grep escrow | awk '{print $2}' || echo "")
if [[ -z "$PROGRAM_ID" ]]; then
  # Fallback: read from Anchor.toml
  PROGRAM_ID=$(grep -A1 '\[programs.devnet\]' Anchor.toml | grep 'escrow' | awk -F'"' '{print $2}')
fi

echo ""
echo "=== Deployment Complete ==="
echo "Program ID: $PROGRAM_ID"
echo "Network: devnet ($DEVNET_URL)"
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""
echo "Next steps:"
echo "  1. Run create-devnet-mint.ts to create SPL mint"
echo "  2. Update fe/src/config/contracts.ts with the program ID and mint address"
