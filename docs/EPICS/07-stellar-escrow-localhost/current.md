# EPIC-07: Stellar Escrow on Localhost — Current Status

## Status

**Phase:** In Progress
**Active slice:** 07-2 (next)
**Last updated:** 2026-09-04

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 07-1 | ✅ Done | Soroban project setup — workspace, Cargo.toml, lib.rs scaffold, soroban contract build passes |
| 07-2 | ✅ Done | Escrow data structure — types.rs with EscrowData, EscrowStatus, DataKey; store/retrieve test passes |
| 07-3 | Pending | Create function (storage + SAC transfer) |
| 07-4 | Pending | Release function |
| 07-5 | Pending | Refund function |
| 07-6 | Pending | Tests + test SAC token |
| 07-7 | Pending | Deploy + ABI export + frontend types |

## What's done

### SLICE-07-1: Soroban project setup
- `blockchains/stellar/Cargo.toml` — new (workspace root, members: contracts/escrow, soroban-sdk 28.0.0-rc.1)
- `blockchains/stellar/contracts/escrow/Cargo.toml` — new (soroban-sdk dep, crate-type cdylib+rlib, testutils dev-dep)
- `blockchains/stellar/contracts/escrow/src/lib.rs` — new (#[contract] Escrow struct, #[contractimpl] with placeholder)
- `blockchains/stellar/contracts/escrow/tests/escrow.rs` — new (integration test: registers contract in Env)
- `soroban contract build` compiles: 371 bytes optimized WASM
- `cargo test` passes: 1 test (test_build)
- Soroban CLI v28.0.0 installed
- wasm32v1-none target added via rustup

### SLICE-07-2: Escrow data structure
- `blockchains/stellar/contracts/escrow/src/types.rs` — new
- `EscrowData` struct: depositor, beneficiary, resolver, token (Address), amount (i128), status (EscrowStatus), nonce (u64), created_at (u64)
- `EscrowStatus` enum: Created=0, Released=1, Refunded=2 (Clone, Copy, Debug, PartialEq, Eq)
- `DataKey` enum: Escrow(u64), Counter — for storage key scheme
- `lib.rs` updated: `mod types` + `pub use types::{DataKey, EscrowData, EscrowStatus}`
- Tests: store/retrieve EscrowData via persistent storage (2 tests, both pass)

## What's next

SLICE-07-3 (Create function) — storage init + SAC token transfer.

## Open questions

- None

## Grill decisions

- Single `create_escrow` function (storage + SAC transfer in one call)
- Test SAC token included in 07-6 test setup — no separate slice
- Events (`env.events().publish`) included in each function — no separate slice
- 07-7 includes deploy + ABI export + config update
- 07-1 depends on 05-4 (faucet) — needs funded accounts
- All paths use `fe/` prefix for frontend files
- Functions: one file per function (create.rs, release.rs, refund.rs)
- Storage: `Escrow(nonce)` key with `DataKey::Counter` for nonce increment
- 07-4 and 07-5 parallel after 07-3
- Graphify: `cd blockchains/stellar && graphify update .` after each slice
- soroban-sdk 28.0.0-rc.1 matches soroban-cli v28.0.0
- crate-type includes rlib for integration tests
