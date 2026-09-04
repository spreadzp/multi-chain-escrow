# EPIC-06: Solana Escrow on Localhost — Current Status

## Status

**Phase:** Complete
**Active slice:** None (EPIC-06 done)
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
| 06-7 | ✅ Done | Deploy + IDL export + frontend types — program deployed, IDL copied, contracts.ts updated, build passes |

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
- Test coverage: create happy path + amount=0, release by beneficiary/resolver + unauthorized + double release, refund happy path + non-depositor + status transitions, event verification
- Test infrastructure: SPL mint creation, ATAs for all roles, helper functions
- Validator setup: `--clone-feature-set` from mainnet to enable SBPF v2 feature gates

### SLICE-06-7: Deploy + IDL export + frontend types
- Program deployed to local validator: `BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj`
- `fe/src/config/solana-idl.json` — new (exported Anchor IDL, 23KB)
- `fe/src/types/solana-escrow.ts` — new (Anchor-generated TypeScript types, 23KB)
- `fe/src/config/contracts.ts` — updated (real program ID + resolver ID for solana-local)
- `package.json` — updated (added `chain:solana:deploy` script)
- `blockchains/solana/scripts/start-validator.sh` — updated (added `--clone-feature-set` for SBPF v2)
- `anchor test` passes (10/10), `npm run build` passes in fe/
- Graphify indexed: 132 nodes, 161 edges, 13 communities

## What's next

EPIC-06 is complete. Next EPIC: EPIC-08 (Solana adapter) can use the IDL, types, and config to interact with the deployed program.

## Open questions

- Token mint address is dynamic (created per test run) — EPIC-08 will need to create a persistent mint or set it at runtime

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
