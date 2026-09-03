# Local Chain Tooling

Scripts and configs for running local Solana and Stellar networks for development.

## Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| **Node.js** ≥ 20 | Run TypeScript scripts (via `tsx`) | [nodejs.org](https://nodejs.org) |
| **Docker** | Run Stellar local network container | [docker.com](https://docker.com) |
| **Docker Compose V2** | Orchestrate Stellar container | Bundled with Docker Desktop |
| **Solana CLI** *(coming with EPIC-05-1)* | Local validator + airdrops | `sh -c "$(curl -sSfL https://release.solana.com/stable/install"` |
| **Rust** *(coming with EPIC-06/07)* | Compile Solana/Stellar contracts | [rustup.rs](https://rustup.rs) |

Install project dependencies:

```bash
npm install
```

## Quick Start

### Stellar

```bash
# 1. Start local network (Docker)
npm run chain:stellar

# 2. Generate + fund keypairs (deployer, depositor, beneficiary, resolver)
npm run chain:stellar:faucet

# 3. Stop network when done
npm run chain:stellar:stop
```

### Solana *(coming with EPIC-05-1/05-2)*

```bash
# 1. Start local validator
npm run chain:solana

# 2. Generate + fund keypairs
npm run chain:solana:faucet

# 3. Stop validator
npm run chain:solana:stop
```

### Health Check

```bash
# Check both networks
npm run chain:health

# Check only Solana
npm run chain:health -- --solana

# Check only Stellar
npm run chain:health -- --stellar
```

## Full Workflow Order

1. **Start chains** — `npm run chain:stellar` (and `npm run chain:solana` when available)
2. **Fund accounts** — `npm run chain:stellar:faucet` (and `npm run chain:solana:faucet` when available)
3. **Health check** — `npm run chain:health`
4. **Deploy contracts** — *(coming with EPIC-06 Solana / EPIC-07 Stellar)*
5. **Start frontend** — `cd fe && npm run dev`
6. **Connect wallet** — switch to local network in the UI

## Troubleshooting

### Port already in use

```bash
npm run chain:stellar:stop
# Wait a moment, then restart
npm run chain:stellar
```

### Docker not running

Start Docker Desktop or the Docker daemon manually:

```bash
# Linux
sudo systemctl start docker

# Then retry
npm run chain:stellar
```

### RPC not responding

1. Run `npm run chain:health` to see which network is down
2. Check logs in `blockchains/stellar/.logs/network.log`
3. Restart the network: `npm run chain:stellar:stop && npm run chain:stellar`

### Friendbot / faucet not working

The `stellar/quickstart:testing` image's Friendbot endpoint is non-functional. The faucet script (`faucet.ts`) works around this by funding accounts directly from the Stellar root account. If funding fails:

- Ensure the Stellar network is running (`npm run chain:health -- --stellar`)
- Check that the root account has sufficient balance
- Look for transaction errors in the script output

### Solana airdrop limit exceeded *(coming with EPIC-05-2)*

Reset the local validator to clear state:

```bash
npm run chain:solana:stop
npm run chain:solana -- --reset
```

## Key Files

| File | Description |
|------|-------------|
| `blockchains/stellar/docker-compose.yml` | Stellar Docker Compose config (ports 8000/8001/8002) |
| `blockchains/stellar/scripts/start-network.sh` | Start Stellar local network |
| `blockchains/stellar/scripts/stop-network.sh` | Stop Stellar local network |
| `blockchains/stellar/scripts/faucet.ts` | Generate + fund Stellar keypairs |
| `blockchains/scripts/health-check.ts` | Health check for both networks |
| `blockchains/stellar/.local-keys/` | Generated Stellar keypairs (gitignored) |
| `blockchains/stellar/.logs/` | Network logs (gitignored) |
| `blockchains/solana/` | Solana scripts *(coming with EPIC-05-1)* |

## Environment Variables

Frontend environment is configured in `fe/.env.local` (gitignored). See `fe/.env.example` for all available vars:

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_MOCK_MODE` | `true` | When `false`, adapters connect to real local networks |
| `NEXT_PUBLIC_RPC_SOLANA_LOCAL` | `http://localhost:8899` | Solana local RPC URL |
| `NEXT_PUBLIC_RPC_STELLAR_LOCAL` | `http://localhost:8000` | Stellar local RPC URL |
| `SOLANA_LOCAL_KEYS_DIR` | `../blockchains/solana/.local-keys` | Path to Solana keypair files |
| `STELLAR_LOCAL_KEYS_DIR` | `../blockchains/stellar/.local-keys` | Path to Stellar keypair files |

## Network Endpoints

### Stellar (stellar/quickstart:testing)

| Service | URL | Port |
|---------|-----|------|
| Soroban RPC | `http://localhost:8000` | 8000 |
| Horizon API | `http://localhost:8001` | 8001 |
| Friendbot | `http://localhost:8002` | 8002 (non-functional in this image) |

Network passphrase: `Standalone Network ; February 2017`

### Solana *(coming with EPIC-05-1)*

| Service | URL | Port |
|---------|-----|------|
| RPC | `http://localhost:8899` | 8899 |
| WebSocket | `ws://localhost:8900` | 8900 |
