# EPIC-06: Solana Escrow on Localhost — Current Status

## Status

**Phase:** In Progress
**Active slice:** 06-7 (next)
**Last updated:** 2026-09-04

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 06-1 | ✅ Done | Anchor project setup — workspace, Cargo.toml, lib.rs scaffold, anchor build passes |
| 06-2 | ✅ Done | Escrow account struct — state.rs with EscrowAccount, EscrowStatus, PDA seeds |
| 06-3 | ✅ Done | Create instruction — PDA init + SPL transfer + DepositedEvent |
| 06-4 | ✅ Done | Release instruction — PDA-signed CPI transfer to beneficiary + ReleasedEvent |
| 06-5 | ✅ Done | Refund instruction — PDA-signed CPI transfer back to depositor + RefundedEvent |
| 06-6 | ✅ Done | Anchor test suite — 10 tests passing (create, release, refund, role denial, status transitions, events) |
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

### SLICE-06-3: Create instruction (PDA + SPL deposit)
- `blockchains/solana/programs/escrow/src/instructions/create.rs` — new
- `CreateEscrow` accounts: depositor (signer), mint, depositor_ata, escrow_pda (init), escrow_ata (init), token_program, ATA program, system_program, rent
- `create_escrow`: validates amount > 0, inits PDA, CPI token::transfer, emits DepositedEvent
- `DepositedEvent`, `EscrowError::InvalidAmount`

### SLICE-06-4: Release instruction
- `blockchains/solana/programs/escrow/src/instructions/release.rs` — new
- `ReleaseEscrow` accounts: signer (beneficiary or resolver), escrow_pda (seeds + constraint), mint, escrow_ata, beneficiary_ata, token_program
- `release_escrow`: validates status==Created, validates signer==beneficiary||signer==resolver, CPI token::transfer from escrow ATA to beneficiary ATA (PDA signs), sets status to Released, emits ReleasedEvent
- `ReleasedEvent` with #[event] derive
- `ReleaseError::NotCreated`, `ReleaseError::NotAuthorized`
- beneficiary_ata uses `associated_token::authority = escrow_pda.beneficiary` (derives from escrow state)
- Same borrow pattern as refund: immutable for CPI, mutable for status update

### SLICE-06-5: Refund instruction
- `blockchains/solana/programs/escrow/src/instructions/refund.rs` — new
- `RefundEscrow` accounts: signer (depositor), escrow_pda (seeds + constraint), mint, escrow_ata, depositor_ata, token_program
- `refund_escrow`: validates status==Created, validates signer==depositor, CPI token::transfer from escrow ATA to depositor ATA (PDA signs), sets status to Refunded, emits RefundedEvent
- `RefundedEvent`, `RefundError::NotCreated`, `RefundError::NotDepositor`

### SLICE-06-6: Anchor test suite
- `blockchains/solana/tests/escrow.ts` — comprehensive test suite (10 tests, all passing)
- Test coverage:
  - create_escrow: happy path (PDA, tokens, status), amount=0 rejection
  - release_escrow: beneficiary release, resolver release, unauthorized rejection, double release rejection
  - refund_escrow: happy path, non-depositor rejection, refund on Released rejection, release on Refunded rejection
  - Event verification: ReleasedEvent and RefundedEvent confirmed via "Program data:" log entries
- Test infrastructure: SPL mint creation, ATAs for all roles, helper functions (findEscrowPda, getTokenBalance, createEscrow, deriveEscrowAta)
- Validator setup: `--clone-feature-set` from mainnet to enable SBPF v2 feature gates
- Graphify indexed: 132 nodes, 161 edges, 13 communities

## What's next

SLICE-06-7 (Deploy + IDL export + frontend types) — deploy to local validator, copy IDL, update frontend config.

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
- Graphify: `cd blockchains/solana && graphify update .` after each slice
