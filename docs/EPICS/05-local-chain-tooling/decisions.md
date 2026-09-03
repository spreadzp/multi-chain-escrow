# EPIC-05: Local Chain Tooling — Decisions Log

## Decisions

| ID | Date | Decision | Rationale |
|----|------|----------|-----------|
| D1 | — | solana-test-validator for local Solana | Standard tool, fast startup |
| D2 | — | Docker for Stellar local network | Isolated, reproducible |
| D3 | — | Scripts in blockchains/{chain}/scripts/ | Co-located with contracts |
| D4 | 2026-09-02 | Keypair generation in faucet slices | Faucet generates keys then funds them — one flow |
| D5 | 2026-09-02 | 05-7 added for local dev workflow doc | Was in intro/slices.md item 8 but missing from EPIC |
| D6 | 2026-09-02 | 05-6 depends on 01-6 + 01-7 | Updates chains.ts (01-6) and .env (01-7) |
| D7 | 2026-09-02 | Single health-check script with flags | --solana/--stellar/--all — simpler for CI |
| D8 | 2026-09-02 | Docker compose at blockchains/stellar/docker-compose.yml | Co-located with Stellar scripts |
| D9 | 2026-09-02 | Root package.json with chain:* scripts | Scripts run shell files from blockchains/, not frontend |
| D10 | 2026-09-02 | Config paths use fe/ prefix | fe/src/config/chains.ts — monorepo convention |
| D11 | 2026-09-03 | stellar/quickstart:testing image | Official Stellar quickstart with Soroban RPC + friendbot; --standalone --enable-soroban-rpc flags |
| D12 | 2026-09-03 | Friendbot port 8002 not 8001 | quickstart:testing exposes Horizon on 8001, Friendbot on 8002 — added port mapping to docker-compose.yml |
| D13 | 2026-09-03 | Fund via root account instead of Friendbot | Friendbot in quickstart:testing returns 404 for all funding requests; used root account (from friendbot.cfg secret) with Horizon createAccount ops instead |
| D14 | 2026-09-03 | Health-check at blockchains/scripts/ (shared) | Single script for both chains — not in chain-specific subdir |
| D15 | 2026-09-03 | Solana check via JSON-RPC getHealth | More reliable than shelling out to solana CLI — pure HTTP, no binary dependency |
| D16 | 2026-09-03 | faucetUrl optional on ChainConfig | Only Stellar has a faucet endpoint; Solana faucet is CLI-based |
| D17 | 2026-09-03 | keysDir in env.ts with fallback to chains.ts defaults | Env override → chains.ts → hardcoded fallback; same pattern as rpcUrls |
| D18 | 2026-09-03 | README marks EPIC-06/07 as "coming soon" | Avoid broken links to non-existent contract deployment docs |
| D19 | 2026-09-03 | Solana CLI from anza.xyz (Agave fork) | Official solana.com SSL failed; anza.xyz is the Agave/Solana 4.x release channel |
| D20 | 2026-09-03 | Solana getHealth returns result as string | Fixed health-check: `data.result === "ok"` not `data.result.status === "ok"` — Solana JSON-RPC returns bare string |
