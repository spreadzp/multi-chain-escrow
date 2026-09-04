# EPIC-09: Stellar Adapter Implementation — Current Status

## Status

**Phase:** In Progress
**Active slice:** 09-3
**Last updated:** 2026-09-04

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 09-1 | ✅ Done | Scaffold + connection + wallet — 12 tests pass |
| 09-2 | ✅ Done | create implementation — 6 tests pass, build passes |
| 09-3 | ✅ Done | release + refund implementation — 7 tests pass, build passes |
| 09-4 | Pending | list + get — contract storage iteration (1.5h) |
| 09-5 | Pending | Event parsing + subscribeEvents polling (1.5h) |
| 09-6 | Pending | Integration tests on local network (2.5h) |

## What's done

### SLICE-09-1: Scaffold + connection + wallet
- `fe/src/adapters/stellar/connection.ts` — RPC server, contract ID, ABI, keypair utils
- `fe/src/adapters/stellar/index.ts` — `StellarEscrowAdapter` class
- `fe/src/adapters/stellar/__tests__/scaffold.test.ts` — 12 tests

### SLICE-09-2: create implementation
- `fe/src/adapters/stellar/create.ts` — `createEscrowTransaction`: simulate, prepare, sign, send, poll, extract nonce
- `fe/src/adapters/stellar/__tests__/create.test.ts` — 6 tests

### SLICE-09-3: release + refund implementation
- `fe/src/adapters/stellar/tx.ts` — shared `submitContractCall` helper (simulate → prepare → sign → send → poll)
  - Extracted common transaction submission logic from create.ts
  - `extractReturnValue` for parsing Soroban return values
- `fe/src/adapters/stellar/release.ts` — `releaseEscrowTransaction`: calls `release_escrow(caller, nonce)`
- `fe/src/adapters/stellar/refund.ts` — `refundEscrowTransaction`: calls `refund_escrow(caller, nonce)`
- `fe/src/adapters/stellar/index.ts` — wired `releaseEscrow` and `refundEscrow`
- `fe/src/adapters/stellar/__tests__/release-refund.test.ts` — 7 tests (mock SDK)
  - release: returns txHash, calls simulate→prepare→send, throws on sim error, throws on send ERROR
  - refund: returns txHash, calls simulate→prepare→send, throws on sim error
- `fe/src/adapters/stellar/__tests__/scaffold.test.ts` — removed release/refund stub checks
- `npm run build` passes, `vitest` 25/25 pass (12 scaffold + 6 create + 7 release/refund)

## What's next

SLICE-09-4: `getEscrow` + `listEscrowsByUser` — contract storage iteration.

## Open questions

- None
