# EPIC-08: Solana Adapter Implementation — Current Status

## Status

**Phase:** In Progress
**Active slice:** 08-1 (complete)
**Last updated:** 2026-09-04

## Slice Progress

| Slice | Status | Notes |
|-------|--------|-------|
| 08-1 | ✅ Done | Scaffold + connection + wallet + IDL load; 10 tests pass |
| 08-2 | ✅ Done | createEscrow — PDA derivation, ATA, instruction builder; 8 tests pass |
| 08-3 | ✅ Done | releaseEscrow + refundEscrow — instruction builders, mint fetch, 8 tests pass |
| 08-4 | Pending | listEscrowsByUser + getEscrow (getProgramAccounts) |
| 08-5 | Pending | Event parsing + subscribeEvents (polling) |
| 08-6 | Pending | Integration tests on local validator |

## What's done

### SLICE-08-1: Solana adapter scaffold + connection + wallet
- `fe/src/adapters/solana/connection.ts` — Connection, Program, Wallet helpers
- `fe/src/adapters/solana/index.ts` — SolanaEscrowAdapter class implementing EscrowAdapter
- `fe/src/adapters/solana/__tests__/scaffold.test.ts` — 10 unit tests
- Dependencies installed: @solana/web3.js@1.98.4, @coral-xyz/anchor@0.31.1, @solana/spl-token@0.4.15
- All methods stubbed with slice references (createEscrow→08-2, release/refund→08-3, etc.)
- `npm run build` passes, `vitest` 10/10 pass

### SLICE-08-2: createEscrow implementation
- `fe/src/adapters/solana/create.ts` — `findEscrowPda`, `deriveEscrowAta`, `createEscrowInstruction`
- PDA seeds: `[SEED_PREFIX, depositor, beneficiary, nonce]` (matches on-chain)
- Nonce: `new BN(Date.now())` — timestamp-based for uniqueness
- ATA derivation: `getAssociatedTokenAddressSync(mint, escrowPda, true)` — allowOwnerOffCurve
- `index.ts` updated: `createEscrow` calls `createEscrowInstruction` with wallet address as depositor
- `fe/src/adapters/solana/__tests__/create.test.ts` — 8 tests (PDA determinism, nonce uniqueness, depositor uniqueness, ATA derivation, wallet guard, seed prefix verification)
- Tests use `// @vitest-environment node` for Buffer/crypto globals
- `npm run build` passes, `vitest` 19/19 pass (11 scaffold + 8 create)

### SLICE-08-3: releaseEscrow + refundEscrow
- `fe/src/adapters/solana/release.ts` — `releaseEscrowInstruction` (signer, escrowPda, mint → tx)
- `fe/src/adapters/solana/refund.ts` — `refundEscrowInstruction` (signer, escrowPda, mint → tx)
- `index.ts` — `releaseEscrow`/`refundEscrow` fetch mint from on-chain escrow account, then call instruction
- `getMintFromEscrow` helper — fetches `escrowAccount` by PDA, extracts mint field
- `fe/src/adapters/solana/__tests__/release-refund.test.ts` — 8 tests
- `npm run build` passes, `vitest` 27/27 pass

## What's next

SLICE-08-4 (listEscrowsByUser + getEscrow) — read PDA accounts via `getProgramAccounts` with memcmp filter.

## Open questions

- None

## Grill decisions

- `fe/` prefix for all adapter files — `fe/src/adapters/solana/`
- Single `createEscrow` method — no separate `deposit` (matches EPIC-06 single instruction)
- `deposit` removed from method list — not in `EscrowAdapter` interface
- 08-1 depends on 02-4 (Phantom wallet integration) — adapter needs wallet signing
- `listEscrowsByUser` uses `getProgramAccounts` with memcmp filter on depositor
- `subscribeEvents` — polling-based (2s interval), not websocket
- Events: separate slice (08-5) — parsing Anchor logs is non-trivial
- One file per method: create.ts, release.ts, refund.ts, query.ts, events.ts
- Wallet: adapter constructor takes Connection + wallet from EPIC-02 WalletSession
- IDL imported as JSON and cast to `any` — Anchor 0.31 strict Idl type doesn't match exported IDL
- `tx.sign` cast to bypass `Signer & Signer[]` intersection type quirk in @solana/web3.js v1.98
