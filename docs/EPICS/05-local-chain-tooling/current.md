# EPIC-05: Local Chain Tooling — Current Status

## Status

**Phase:** Complete
**Active slice:** None
**Last updated:** 2026-09-03

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 05-1 | ✅ Done | Solana local validator scripts — start/stop, RPC poll, idempotent |
| 05-2 | ✅ Done | Solana faucet + keypairs — 4 roles, 10 SOL each, idempotent |
| 05-3 | ✅ Done | Stellar local network (Docker) — tested start/stop/RPC/friendbot |
| 05-4 | ✅ Done | Stellar faucet + keypairs — 4 roles funded, idempotent |
| 05-5 | ✅ Done | Health-check both networks — --solana/--stellar/--all flags, colored output |
| 05-6 | ✅ Done | RPC config + env integration — chains.ts, env.ts, .env.local, .env.example updated |
| 05-7 | ✅ Done | Local dev workflow doc — blockchains/README.md |

## What's done

### SLICE-05-1: Solana local validator scripts

- `blockchains/solana/scripts/start-validator.sh` — new (solana CLI check, kill existing, start with --reset, RPC poll 15s)
- `blockchains/solana/scripts/stop-validator.sh` — new (kill by port, pkill fallback)
- `blockchains/solana/.gitignore` — new (.logs/ + .local-keys/)
- `package.json` — updated (added chain:solana + chain:solana:stop scripts)
- `blockchains/scripts/health-check.ts` — fixed Solana getHealth response parsing (result is string "ok", not {status: "ok"})
- Solana CLI v4.2.2 (Agave) installed from anza.xyz release channel
- Tested: start → RPC ready in 2s, re-run → kills existing + restarts, stop → clean shutdown, health check → ✓

### SLICE-05-2: Solana faucet + keypairs

- `blockchains/solana/scripts/faucet.ts` — new (keypair gen via solana-keygen, airdrop via solana CLI)
- `package.json` — updated (added chain:solana:faucet script)
- Roles: deployer, depositor, beneficiary, resolver — each funded with 10 SOL
- Idempotent: loads existing keypairs from `.local-keys/{role}.json`, skips already-funded accounts
- Keypair files compatible with Solana CLI (JSON array format + structured metadata)
- Tested: `npm run chain:solana:faucet` → 4 keypairs created + airdropped, re-run → all loaded + skipped

### SLICE-05-3: Stellar local network (Docker)

- `blockchains/stellar/docker-compose.yml` — new (stellar/quickstart:testing, ports 8000+8001+8002, volume persistence)
- `blockchains/stellar/scripts/start-network.sh` — new (docker check, compose up, RPC poll 30s)
- `blockchains/stellar/scripts/stop-network.sh` — new (compose down)
- `blockchains/stellar/.gitignore` — new (.logs/ + .local-keys/)
- `package.json` — new root package.json with chain:stellar + chain:stellar:stop scripts
- Tested: `npm run chain:stellar` → RPC ready in 12s, `npm run chain:stellar:stop` → clean shutdown
- Friendbot on :8002, Soroban RPC on :8000, Horizon on :8001

### SLICE-05-4: Stellar faucet + keypairs

- `blockchains/stellar/scripts/faucet.ts` — new (Keypair gen via @stellar/stellar-sdk, funds via root account)
- `package.json` — updated (added chain:stellar:faucet script)
- `blockchains/stellar/docker-compose.yml` — updated (added port 8002 mapping for friendbot)
- Roles: deployer, depositor, beneficiary, resolver — each funded with 10,000 XLM
- Idempotent: loads existing keypairs from `.local-keys/{role}.json`, skips already-funded accounts
- Friendbot in quickstart:testing was non-functional (404 on all requests) — used root account directly via Horizon
- Root account secret from friendbot config: `SC5O7VZUXDJ6JBDSZ74DSERXL7W3Y5LTOAMRF7RQRL3TAGAPS7LUVG3L`
- Tested: `npm run chain:stellar:faucet` → 4 keypairs created + funded, re-run → all loaded + skipped

### SLICE-05-5: Health-check both networks

- `blockchains/scripts/health-check.ts` — new (shared script for both chains)
- `package.json` — updated (added chain:health script)
- CLI flags: `--solana`, `--stellar`, `--all` (default)
- Solana check: JSON-RPC `getHealth` on localhost:8899
- Stellar check: HTTP GET `/health` on localhost:8000
- Colored output: ✓ green / ✗ red, with response time and detail
- Exit code 0 if all checked networks healthy, 1 if any down
- 5s timeout per network via AbortController
- Tested: both down → exit 1, Stellar up + `--stellar` → exit 0, Solana up + `--solana` → exit 0, `--all` mixed → exit 1

### SLICE-05-6: RPC config + env integration

- `fe/src/shared/types/chain.ts` — updated (added `faucetUrl?: string` to ChainConfig)
- `fe/src/config/chains.ts` — updated (localhost URLs, faucetUrl for stellar-local)
- `fe/src/config/env.ts` — updated (added keysDir for solana/stellar local keys)
- `fe/.env.local` — new (NEXT_PUBLIC_MOCK_MODE=false, RPC URLs, keys dirs)
- `fe/.env.example` — updated (documented keys dir vars)
- `npm run build` passes in fe/
- All 236 tests pass

### SLICE-05-7: Local dev workflow doc

- `blockchains/README.md` — new (prerequisites, quick start, full workflow, troubleshooting, key files, env vars, network endpoints)
- Covers both Solana and Stellar
- EPIC-06/07 contract deployment marked as "coming soon"
- All referenced file paths verified correct

## EPIC-05 Complete

All 7 slices done. Local chain tooling fully operational for both Solana and Stellar.

## Open questions

- None

## Grill decisions

- Keypair generation merged into faucet slices (05-2, 05-4) — not separate slice
- 05-7 added for local dev workflow documentation
- 05-6 depends on 01-6 + 01-7 — updates chains.ts and .env
- Health-check is single script with --solana/--stellar/--all flags
- Docker compose at `blockchains/stellar/docker-compose.yml`
- Root `package.json` with chain:* scripts (not in fe/)
- 05-1 and 05-3 effort bumped to 1.5h
- 05-7 parallel with 05-6
- Graphify: `cd fe && graphify update .` after each slice
