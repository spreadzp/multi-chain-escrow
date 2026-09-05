# EPIC-10: On-Chain Sync & Event Listening — Current Status

## Status

**Phase:** In Progress
**Active slice:** 10-1
**Last updated:** 2026-09-05

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 10-1 | ✅ Done | Sync manager scaffold + poll loop — 7 tests |
| 10-2 | Pending | Event subscription + store integration (2h) |
| 10-3 | Pending | Sync lifecycle — connect/reload/chain switch (1.5h) |
| 10-4 | Pending | UI auto-refresh on sync (1h) |
| 10-5 | Pending | Error handling + retries (1h) |
| 10-6 | Pending | E2E sync tests both chains (2h) |

## What's done

### SLICE-10-1: Sync manager scaffold + poll loop
- `fe/src/sync/types.ts` — SyncState, SyncManagerOptions, DEFAULT_POLL_INTERVAL_MS (5s)
- `fe/src/sync/manager.ts` — SyncManager singleton
  - `start(adapter, address, onPoll?)` — starts polling, immediate first poll
  - `stop()` — clears interval, resets state
  - `isRunning()` / `getState()` — introspection
  - Poll loop calls `adapter.listEscrowsByUser(address)` every 5s
  - Updates Zustand store: `setEscrows`, `setLoading`, `setError`
  - Graceful error handling — sets error state, continues polling
  - Chain-agnostic — uses only EscrowAdapter interface
- `fe/src/sync/__tests__/manager.test.ts` — 7 tests
  - Singleton pattern, immediate poll, interval polling, stop clears interval
  - getState, error handling, start replaces previous session
- Build passes, all tests pass
