# EPIC-10: On-Chain Sync & Event Listening — Current Status

## Status

**Phase:** Complete
**Active slice:** —
**Last updated:** 2026-09-05

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 10-1 | ✅ Done | Sync manager scaffold + poll loop — 7 tests |
| 10-2 | ✅ Done | Event subscription + store integration — 15 tests |
| 10-3 | ✅ Done | Sync lifecycle — connect/reload/chain switch — 10 tests |
| 10-4 | ✅ Done | UI auto-refresh on sync — 17 tests |
| 10-5 | ✅ Done | Error handling + retries — 19 tests |
| 10-6 | ✅ Done | E2E sync tests both chains — 7 tests |

## What's done

### SLICE-10-6: E2E sync tests — 7 tests
- `fe/src/sync/__tests__/e2e-sync.test.ts` — E2E tests using MockEscrowAdapter
  - Stellar: create→sync→store update, event→store patch (Released)
  - Solana: create→sync→store update, event→store patch (Refunded)
  - Chain switch: Stellar→Solana restarts sync, both chains' escrows in store
  - Error: network error → store.error "Сеть недоступна", UI survives
  - Error: non-transient error → no retry, immediate store.error
- `fe/src/sync/manager.ts` — now uses `applyEscrowsToStore` (preserves other chains)
- `fe/src/sync/__tests__/manager.test.ts` — updated mock store for applyEscrowsToStore
- All 75 sync tests pass, build succeeds

## EPIC-10 Complete

All 6 slices delivered. 75 unit/E2E tests pass. Build succeeds.
