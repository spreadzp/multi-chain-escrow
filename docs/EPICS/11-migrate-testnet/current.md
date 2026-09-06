# EPIC-11: Migrate to Public Testnet — Current Status

## Status

**Phase:** In progress
**Active slice:** 11-2 (complete)
**Last updated:** 2026-09-06

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 11-1 | ✅ Done | Solana escrow deployed to devnet, SPL mint created, IDL exported |
| 11-2 | ✅ Done | Stellar escrow deployed to testnet, SAC token created, ABI exported |
| 11-3 | Pending | Environment switching + config update (1.5h) |
| 11-4 | Pending | E2E tests on testnet both chains (2.5h) |

## What's done

### SLICE-11-1: Deploy Solana Escrow to Devnet

- `blockchains/solana/scripts/deploy-devnet.sh` — Anchor deploy to devnet script
- `blockchains/solana/scripts/create-devnet-mint.ts` — SPL mint creation on devnet
- `blockchains/solana/Anchor.toml` — Updated with `[programs.devnet]` section
- `fe/src/config/solana-idl.json` — IDL re-exported from build
- `fe/src/config/contracts.ts` — `solanaDevnetContracts` updated with real addresses
- Program ID: `BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj`
- SPL Mint: `BSXLVemNjhY9TiT2pb5jmMhBYPHM1nrA8kadMNTT6Cxn` (6 decimals)

### SLICE-11-2: Deploy Stellar Escrow to Testnet

**Deliverables completed:**
- `blockchains/stellar/scripts/deploy-testnet.sh` — Stellar contract deploy to testnet script
- `blockchains/stellar/scripts/create-testnet-sac.ts` — SAC token creation on testnet
- `fe/src/config/stellar-abi.json` — ABI exported with contract spec
- `fe/src/config/contracts.ts` — `stellarTestnetContracts` updated with real addresses

**Testnet deployment details:**
- Contract ID: `CA7LUBLVG3QOXHYRZH65R2QODJMNSMZU65TOC2ZRJFWYBCTFQOEMRM44`
- SAC Token: `CC6PM5SSZIXX5U54T2D375HYMR6VXWR5B7GRVFNSV6JLO3LNFGJ7ZXQZ` (TEST asset, 6 decimals)
- Resolver/Deployer: `GDXMWQDVZ5DORJFPIPUDFRML2OEPBMSG77J2TIIGWRIBSRWPT5EK2GG5`
- Explorer: https://stellar.expert/explorer/testnet/contract/CA7LUBLVG3QOXHYRZH65R2QODJMNSMZU65TOC2ZRJFWYBCTFQOEMRM44
- Asset: TEST:GDXMWQDVZ5DORJFPIPUDFRML2OEPBMSG77J2TIIGWRIBSRWPT5EK2GG5
- Supply: 1,000,000,000 TEST tokens

**npm scripts added:**
- `npm run chain:stellar:deploy:testnet` — deploy contract to testnet
- `npm run chain:stellar:sac:testnet` — create SAC token on testnet

**Acceptance criteria:**
- [x] `stellar contract deploy` on testnet — no errors
- [x] SAC token created on testnet
- [x] ABI re-exported to `fe/src/config/stellar-abi.json`
- [x] Contract ID recorded in `contracts.ts`
- [x] Friendbot works on testnet

## What's next

SLICE-11-3: Environment switching + config update. The contracts are deployed on both public networks (Solana devnet + Stellar testnet). Next step is to wire up the UI to support switching between local/devnet/testnet environments.

## Open questions

- Devnet airdrop rate limits may require pre-funded accounts for testing
- Stellar testnet friendbot rate limits similar
