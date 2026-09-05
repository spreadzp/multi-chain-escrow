# EPIC-10: On-Chain Sync & Event Listening — Current Status

## Status

**Phase:** In Progress
**Active slice:** 10-3
**Last updated:** 2026-09-05

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 10-1 | ✅ Done | Sync manager scaffold + poll loop — 7 tests |
| 10-2 | ✅ Done | Event subscription + store integration — 15 tests |
| 10-3 | ✅ Done | Sync lifecycle — connect/reload/chain switch — 10 tests |
| 10-4 | Pending | UI auto-refresh on sync (1h) |
| 10-5 | Pending | Error handling + retries (1h) |
| 10-6 | Pending | E2E sync tests both chains (2h) |

## What's done

### SLICE-10-3: Sync lifecycle — 10 tests
- `fe/src/sync/lifecycle.ts` — lifecycle handlers
  - `startSyncOnConnect(session, adapter)` — sets wallet address, starts poll loop + event subscription
  - `stopSync(lifecycle)` — stops sync + event subscription, handles null
  - `handleChainSwitch(currentLifecycle, newSession, newAdapter)` — stop current, start fresh
  - `handleReload(session)` — resolves adapter from registry, starts sync
  - `getAdapterForChain(chainId)` — adapter lookup helper
- `fe/src/sync/__tests__/lifecycle.test.ts` — 10 tests
  - startSyncOnConnect, stopSync (incl null), handleChainSwitch, handleReload, getAdapterForChain
- All 32 sync tests pass, build succeeds
