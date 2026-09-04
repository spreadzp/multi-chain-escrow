# EPIC-09: Stellar Adapter Implementation — Current Status

## Status

**Phase:** In Progress
**Active slice:** 09-4
**Last updated:** 2026-09-04

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 09-1 | ✅ Done | Scaffold + connection + wallet — 12 tests pass |
| 09-2 | ✅ Done | create implementation — 6 tests pass |
| 09-3 | ✅ Done | release + refund implementation — 7 tests pass |
| 09-4 | ✅ Done | list + get — contract storage iteration — 11 tests pass |
| 09-5 | Pending | Event parsing + subscribeEvents polling (1.5h) |
| 09-6 | Pending | Integration tests on local network (2.5h) |

## What's done

### SLICE-09-1: Scaffold + connection + wallet
- `connection.ts`, `index.ts`, `scaffold.test.ts` — 12 tests

### SLICE-09-2: create implementation
- `create.ts` — simulate, prepare, sign, send, poll, extract nonce — 6 tests

### SLICE-09-3: release + refund implementation
- `tx.ts` (shared helper), `release.ts`, `refund.ts` — 7 tests

### SLICE-09-4: list + get — contract storage iteration
- `fe/src/adapters/stellar/query.ts` — `fetchEscrowAccount` + `listEscrowAccountsByUser`
  - `makeEscrowKey(nonce)` — constructs `DataKey::Escrow(nonce)` as `ScVal vec [Symbol("Escrow"), U64(nonce)]`
  - `makeCounterKey()` — constructs `DataKey::Counter` as `ScVal vec [Symbol("Counter")]`
  - `mapEscrowData` — maps `RawEscrowData` → domain `Escrow` with status mapping (Created→created, etc.)
  - `mapStatus` — handles both string and array status formats from `scValToNative`
  - `fetchEscrowAccount` — reads contract storage via `getContractData`, returns `Escrow | null`
  - `listEscrowAccountsByUser` — reads counter, iterates 0..count, filters by depositor
- `fe/src/adapters/stellar/index.ts` — wired `getEscrow` and `listEscrowsByUser`
- `fe/src/adapters/stellar/__tests__/query.test.ts` — 11 tests
  - mapStatus: Created/Released/Refunded/unknown
  - mapEscrowData: correct field mapping
  - makeEscrowKey/makeCounterKey: construct keys
  - fetchEscrowAccount: null on error, Escrow on success
  - listEscrowAccountsByUser: empty on counter error, iterates + filters by depositor
- `fe/src/adapters/stellar/__tests__/scaffold.test.ts` — removed get/list stub checks
- `npm run build` passes, `vitest` 36/36 pass (12 scaffold + 6 create + 7 release/refund + 11 query)

## What's next

SLICE-09-5: Event parsing + `subscribeEvents` (polling-based).

## Open questions

- None
