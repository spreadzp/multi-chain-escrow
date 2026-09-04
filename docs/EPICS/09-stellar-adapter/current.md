# EPIC-09: Stellar Adapter Implementation — Current Status

## Status

**Phase:** In Progress
**Active slice:** 09-5
**Last updated:** 2026-09-04

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 09-1 | ✅ Done | Scaffold + connection + wallet — 12 tests pass |
| 09-2 | ✅ Done | create implementation — 6 tests pass |
| 09-3 | ✅ Done | release + refund implementation — 7 tests pass |
| 09-4 | ✅ Done | list + get — contract storage iteration — 11 tests pass |
| 09-5 | ✅ Done | Event parsing + subscribeEvents polling — 9 tests pass |
| 09-6 | Pending | Integration tests on local network (2.5h) |

## What's done

### SLICE-09-1: Scaffold + connection + wallet — 12 tests
### SLICE-09-2: create implementation — 6 tests
### SLICE-09-3: release + refund implementation — 7 tests
### SLICE-09-4: list + get — contract storage iteration — 11 tests

### SLICE-09-5: Event parsing + subscribeEvents polling
- `fe/src/adapters/stellar/events.ts` — event parsing + polling subscription
  - `parseEventFromResponse` — maps `StellarRpc.Api.EventResponse` → `EscrowEvent`
    - Topic[0] = event type ("Deposited"/"Released"/"Refunded"), Topic[1] = nonce
    - Value = tuple of (addresses, amount) depending on event type
    - Maps to `EscrowEvent` with `chainId`, `escrowId`, `txHash`, `blockOrLedger`, `timestamp`, `payload`
  - `subscribeToEscrowEvents` — polling-based subscription
    - 2s interval, uses `getLatestLedger` to track new ledgers
    - First poll: records current ledger (no historical fetch)
    - Subsequent polls: fetches events via `getEvents` with contract filter
    - Returns cleanup function that stops polling
    - Silently ignores polling errors (retry on next interval)
- `fe/src/adapters/stellar/index.ts` — wired `subscribeEvents`
- `fe/src/adapters/stellar/__tests__/events.test.ts` — 9 tests
  - parseEventFromResponse: Deposited, Released, Refunded, unknown type, chainId
  - subscribeToEscrowEvents: returns cleanup, calls onEvent, stops after cleanup, handles errors
- `fe/src/adapters/stellar/__tests__/scaffold.test.ts` — replaced subscribeEvents stub with cleanup function test
- `npm run build` passes, `vitest` 45/45 pass (12+6+7+11+9)

## What's next

SLICE-09-6: Integration tests on local Stellar network.

## Open questions

- None
