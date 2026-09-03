# EPIC-06: Solana Escrow on Localhost — Current Status

## Status

**Phase:** In Progress
**Active slice:** 06-2 (next)
**Last updated:** 2026-09-03

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 06-1 | ✅ Done | Anchor project setup — workspace, Cargo.toml, lib.rs scaffold, anchor build passes |
| 06-2 | Pending | Escrow account struct |
| 06-3 | Pending | Create instruction (PDA + SPL deposit) |
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
- `blockchains/solana/target/deploy/escrow-keypair.json` — program keypair (generated)
- Program ID: `BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj`
- `anchor build` compiles successfully (24s)
- Anchor 0.31.1, Rust 1.95.0, Solana CLI 4.2.2 (Agave)

## What's next

SLICE-06-2 (Escrow account struct) — define Escrow account with fields:
depositor, beneficiary, resolver, mint, amount, nonce, status (created/released/refunded).

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
