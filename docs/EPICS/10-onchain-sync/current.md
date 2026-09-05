# EPIC-10: On-Chain Sync & Event Listening — Current Status

## Status

**Phase:** In Progress
**Active slice:** 10-2
**Last updated:** 2026-09-05

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 10-1 | ✅ Done | Sync manager scaffold + poll loop — 7 tests |
| 10-2 | ✅ Done | Event subscription + store integration — 15 tests |
| 10-3 | Pending | Sync lifecycle — connect/reload/chain switch (1.5h) |
| 10-4 | Pending | UI auto-refresh on sync (1h) |
| 10-5 | Pending | Error handling + retries (1h) |
| 10-6 | Pending | E2E sync tests both chains (2h) |

## What's done

### SLICE-10-1: Sync manager scaffold + poll loop — 7 tests

### SLICE-10-2: Event subscription + store integration — 15 tests
- `fe/src/sync/store-integration.ts` — syncActions → Zustand store
  - `applyEventToStore(event)` — adds event + patches escrow status
  - `applyEscrowsToStore(escrows, chainId)` — full refresh, preserves other chains
  - `reconcileEventWithState(event, knownEscrows)` — Deposited always applied, others only if escrow known
  - Event→status map: Deposited→created, Released→released, Refunded→refunded
- `fe/src/sync/events.ts` — event subscription via adapter.subscribeEvents
  - `startEventSubscription({ adapter })` — subscribes, filters via reconciliation, applies to store
  - Returns cleanup function
- `fe/src/sync/__tests__/store-integration.test.ts` — 11 tests
- `fe/src/sync/__tests__/events.test.ts` — 4 tests
- Build passes, all 22 sync tests pass
