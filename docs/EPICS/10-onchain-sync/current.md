# EPIC-10: On-Chain Sync & Event Listening — Current Status

## Status

**Phase:** In Progress
**Active slice:** 10-5
**Last updated:** 2026-09-05

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 10-1 | ✅ Done | Sync manager scaffold + poll loop — 7 tests |
| 10-2 | ✅ Done | Event subscription + store integration — 15 tests |
| 10-3 | ✅ Done | Sync lifecycle — connect/reload/chain switch — 10 tests |
| 10-4 | ✅ Done | UI auto-refresh on sync — 17 tests |
| 10-5 | ✅ Done | Error handling + retries — 19 tests |
| 10-6 | Pending | E2E sync tests both chains (2h) |

## What's done

### SLICE-10-5: Error handling + retries — 19 tests
- `fe/src/sync/error-handling.ts`
  - `isTransientError(error)` — timeout, network, 503/502/429, ECONNRESET
  - `isNetworkError(error)` — network, fetch, ECONNREFUSED
  - `userErrorMessage(error)` — "Сеть недоступна", "Таймаут запроса", or original
  - `withRetry(fn, maxRetries=3, baseBackoffMs=500)` — exponential backoff (500, 1000, 2000ms)
  - `withErrorHandling(fn, context)` — retry + store.error integration, returns null on failure
  - Constants: MAX_RETRIES=3, BASE_BACKOFF_MS=500
- `fe/src/sync/manager.ts` — poll now uses `withRetry` + `userErrorMessage`
- `fe/src/sync/__tests__/error-handling.test.ts` — 19 tests
- `fe/src/sync/__tests__/manager.test.ts` — updated for retry timing + user-friendly error
- All 68 sync tests pass, build succeeds
