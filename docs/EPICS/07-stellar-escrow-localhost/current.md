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
| 07-3 | ✅ Done | Create function — create_escrow with auth, SAC transfer, storage, nonce, event; 4 tests pass |
| 07-4 | ✅ Done | Release function — release_escrow with role check, SAC transfer to beneficiary, status update; 8 tests pass |
| 07-5 | ✅ Done | Refund function — refund_escrow with depositor check, SAC transfer back, status update; 11 tests pass |
| 07-6 | ✅ Done | Tests — comprehensive suite: 17 tests with helpers, happy paths, role denial, status transitions, events |
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

### SLICE-07-3: Create function (storage + SAC transfer)
- `blockchains/stellar/contracts/escrow/src/functions/create.rs` — new
- `blockchains/stellar/contracts/escrow/src/functions/mod.rs` — new (re-exports)
- `blockchains/stellar/contracts/escrow/src/lib.rs` — updated (mod functions, create_escrow in #[contractimpl])
- `create_escrow`: depositor.require_auth(), amount > 0 validation, nonce from DataKey::Counter (auto-increment), EscrowData stored at DataKey::Escrow(nonce), TokenClient::transfer from depositor to contract, Deposited event, returns nonce
- Tests: create_escrow happy path (storage + token balance + counter), zero amount panic, store/retrieve, status variants (4 tests, all pass)
- WASM: 2270 bytes, 1 exported function

### SLICE-07-4: Release function
- `blockchains/stellar/contracts/escrow/src/functions/release.rs` — new
- `functions/mod.rs` — updated (re-export release_escrow)
- `lib.rs` — updated (release_escrow in #[contractimpl])
- `release_escrow`: caller.require_auth(), load escrow, validate status==Created, validate caller==beneficiary||resolver, TokenClient transfer to beneficiary, set status Released, emit Released event
- Tests: release by beneficiary, release by resolver, unauthorized caller panic, double-release panic (4 new tests, 8 total)

### SLICE-07-5: Refund function
- `blockchains/stellar/contracts/escrow/src/functions/refund.rs` — new
- `functions/mod.rs` — updated (re-export refund_escrow)
- `lib.rs` — updated (refund_escrow in #[contractimpl])
- `refund_escrow`: caller.require_auth(), load escrow, validate status==Created, validate caller==depositor, TokenClient transfer back to depositor, set status Refunded, emit Refunded event
- Tests: refund happy path, unauthorized caller panic, refund after release panic (3 new tests, 11 total)
- WASM: 3 exported functions (create_escrow, release_escrow, refund_escrow)

### SLICE-07-6: Tests (Soroban test + test SAC)
- `contracts/escrow/tests/escrow.rs` — full rewrite with helpers and comprehensive coverage
- Test helpers: `setup_env_and_token`, `mint`, `create_escrow`, `assert_status`, `assert_balance`
- Happy paths: create→release, create→refund, create with storage/balance verification
- Role denial: release by non-beneficiary/non-resolver, refund by non-depositor
- Status transitions: double release, refund after release, release after refund, double refund
- Event verification: Deposited, Released, Refunded events parsed from XDR ContractEventBody::V0
- Multi-escrow: nonce increment test (0, 1, 2)
- 17 tests total, all pass

## What's next

SLICE-07-7 (Deploy + ABI) — deploy to local Stellar network, generate ABI, verify on-network.

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
