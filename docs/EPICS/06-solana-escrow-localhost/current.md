# EPIC-06: Solana Escrow on Localhost — Current Status

## Status

**Phase:** In Progress
**Active slice:** 06-4 / 06-5 (parallel, next)
**Last updated:** 2026-09-04

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 06-1 | ✅ Done | Anchor project setup — workspace, Cargo.toml, lib.rs scaffold, anchor build passes |
| 06-2 | ✅ Done | Escrow account struct — state.rs with EscrowAccount, EscrowStatus, PDA seeds |
| 06-3 | ✅ Done | Create instruction — PDA init + SPL transfer + DepositedEvent |
| 06-4 | Pending | Release instruction |
| 06-5 | Pending | Refund instruction |
| 06-6 | Pending | Tests + test SPL mint |
| 06-7 | Pending | Deploy + IDL export + frontend types |

## What's done

### SLICE-06-1: Anchor project setup

- `blockchains/solana/Anchor.toml` — new (localnet, deployer wallet, program ID)
- `blockchains/solana/Cargo.toml` — new (workspace root, members: programs/escrow)
- `blockchains/solana/programs/escrow/Cargo.toml` — new (anchor-lang 0.31.1, anchor-spl 0.31.1)
- `blockchains/solana/programs/escrow/src/lib.rs` — new (declare_id!, empty #[program] module)
- `blockchains/solana/tests/escrow.ts` — new (placeholder test, connects to local validator)
- `blockchains/solana/package.json` — new (anchor test deps: @coral-xyz/anchor, mocha, chai, ts-mocha)
- `blockchains/solana/tsconfig.json` — new (test TypeScript config)
- Program ID: `BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj`
- `anchor build` compiles successfully

### SLICE-06-2: Escrow account struct

- `blockchains/solana/programs/escrow/src/state.rs` — new
- `EscrowAccount` struct with fields: depositor, beneficiary, resolver, mint, amount, status, nonce, bump, created_at, tx_hash_deposit
- `EscrowStatus` enum: Created, Released, Refunded
- `SEED_PREFIX = b"escrow"`, `pda_seeds()` and `signer_seeds()` helpers
- `#[derive(InitSpace)]` for automatic space calculation
- `anchor build` compiles successfully

### SLICE-06-3: Create instruction (PDA + SPL deposit)

- `blockchains/solana/programs/escrow/src/instructions/create.rs` — new
- `blockchains/solana/programs/escrow/src/instructions/mod.rs` — new
- `CreateEscrow` accounts struct: depositor (signer), mint, depositor_ata, escrow_pda (init), escrow_ata (init), token_program, associated_token_program, system_program, rent
- `create_escrow` instruction: validates amount > 0, inits PDA with all fields, CPI token::transfer from depositor ATA to escrow ATA, emits DepositedEvent
- `DepositedEvent` with #[event] derive
- `EscrowError::InvalidAmount` error code
- `lib.rs` updated: `pub use instructions::create::*; pub use state::*;`, create_escrow in #[program]
- Cargo.toml: `idl-build` feature enables both `anchor-lang/idl-build` and `anchor-spl/idl-build`
- `anchor build` compiles cleanly (no warnings, no errors)

## What's next

SLICE-06-4 (Release instruction) and SLICE-06-5 (Refund instruction) — parallel, both depend on 06-3.

## Open questions

- None

## Grill decisions

- Single `create_escrow` instruction (PDA init + SPL transfer in one tx)
- Test SPL mint included in 06-6 test setup — no separate slice
- Events (`emit!`) included in each instruction — no separate slice
- 06-7 includes deploy + IDL export + config update
- 06-1 depends on 05-2 (faucet) — needs funded deployer
- All paths use `fe/` prefix for frontend files
- Instructions: one file per instruction (create.rs, release.rs, refund.rs)
- Anchor.toml added to Key Files
- 06-4 and 06-5 parallel after 06-3
- Graphify: `cd fe && graphify update .` after each slice
