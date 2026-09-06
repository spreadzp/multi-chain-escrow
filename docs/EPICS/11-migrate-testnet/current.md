# EPIC-11: Migrate to Public Testnet — Current Status

## Status

**Phase:** In progress
**Active slice:** 11-1
**Last updated:** 2026-09-06

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 11-1 | ✅ Done | Solana escrow deployed to devnet, SPL mint created, IDL exported |
| 11-2 | Pending | Deploy Stellar escrow to testnet (2h) |
| 11-3 | Pending | Environment switching + config update (1.5h) |
| 11-4 | Pending | E2E tests on testnet both chains (2.5h) |

## What's done

### SLICE-11-1: Deploy Solana Escrow to Devnet

**Deliverables completed:**
- `blockchains/solana/scripts/deploy-devnet.sh` — Anchor deploy to devnet script
- `blockchains/solana/scripts/create-devnet-mint.ts` — SPL mint creation on devnet
- `blockchains/solana/Anchor.toml` — Updated with `[programs.devnet]` section
- `fe/src/config/solana-idl.json` — IDL re-exported from build
- `fe/src/config/contracts.ts` — Updated `solanaDevnetContracts` with real addresses

**Devnet deployment details:**
- Program ID: `BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj`
- SPL Mint: `BSXLVemNjhY9TiT2pb5jmMhBYPHM1nrA8kadMNTT6Cxn` (6 decimals)
- Resolver/Deployer: `8Drae1LC1vvdxoi6ofH1TEnDdovHQUfM44X3rT6KmsJM`
- Explorer: https://explorer.solana.com/address/BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj?cluster=devnet

**npm scripts added:**
- `npm run chain:solana:deploy:devnet` — deploy program to devnet
- `npm run chain:solana:mint:devnet` — create SPL mint on devnet

**Acceptance criteria:**
- [x] `anchor deploy` on devnet — no errors
- [x] SPL mint created on devnet
- [x] IDL re-exported to `fe/src/config/solana-idl.json`
- [x] Program ID recorded in `contracts.ts`
- [x] `solana airdrop` works on devnet (rate-limited but functional)

## What's next

SLICE-11-2: Deploy Stellar escrow to testnet. Can be done in parallel with 11-3.

## Open questions

- Devnet airdrop rate limits may require pre-funded accounts for testing
