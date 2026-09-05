# EPIC-10: On-Chain Sync & Event Listening — Current Status

## Status

**Phase:** In Progress
**Active slice:** 10-4
**Last updated:** 2026-09-05

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 10-1 | ✅ Done | Sync manager scaffold + poll loop — 7 tests |
| 10-2 | ✅ Done | Event subscription + store integration — 15 tests |
| 10-3 | ✅ Done | Sync lifecycle — connect/reload/chain switch — 10 tests |
| 10-4 | ✅ Done | UI auto-refresh on sync — 17 tests |
| 10-5 | Pending | Error handling + retries (1h) |
| 10-6 | Pending | E2E sync tests both chains (2h) |

## What's done

### SLICE-10-4: UI auto-refresh on sync — 17 tests
- `fe/src/sync/ui-bindings.ts` — React hooks for UI auto-refresh
  - `useSyncAutoRefresh()` — starts/stops sync lifecycle on connect/disconnect/chain switch
  - `useSyncStatus()` — returns `{ loading, error }` from store (reactive)
  - `useEscrowsForActiveChain()` — filtered+sorted escrows for active chain (reactive)
- `fe/src/sync/__tests__/ui-bindings.test.ts` — 10 tests (jsdom)
  - useSyncAutoRefresh: start on session, stop on unmount, no-op without session
  - useSyncStatus: loading/error reactive updates
  - useEscrowsForActiveChain: chain filter, empty, store updates, sort by createdAt desc
- All 49 sync tests pass, build succeeds
