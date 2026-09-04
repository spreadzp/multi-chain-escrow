# EPIC-06: Solana Escrow on Localhost — Decisions Log

## Decisions

| ID | Date | Decision | Rationale |
|----|------|----------|-----------|
| D1 | — | Anchor framework for Solana program | Standard, IDL generation, good DX |
| D2 | — | PDA seeds: [depositor, beneficiary, nonce] | Deterministic derivation, unique per escrow |
| D3 | — | SPL Token for deposits | Standard token standard on Solana |
| D4 | 2026-09-02 | Single create_escrow instruction | PDA init + SPL transfer in one tx — simpler flow |
| D5 | 2026-09-02 | Test SPL mint in 06-6 test setup | Not a separate slice — part of test fixture |
| D6 | 2026-09-02 | Events (emit!) in each instruction | 2-3 lines per instruction, no separate slice |
| D7 | 2026-09-02 | 06-7 includes deploy + IDL + config | Deploy to local, copy IDL, update contracts.ts |
| D8 | 2026-09-02 | 06-1 depends on 05-2 (faucet) | anchor build/test needs funded deployer |
| D9 | 2026-09-02 | One file per instruction | create.rs, release.rs, refund.rs — Anchor convention |
| D10 | 2026-09-02 | IDL path uses fe/ prefix | fe/src/config/solana-idl.json — monorepo convention |
| D11 | 2026-09-03 | Program ID generated via solana-keygen | BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj — keypair in target/deploy/ |
| D12 | 2026-09-03 | Anchor.toml wallet path = .local-keys/deployer.json | Relative to blockchains/solana/ — matches 05-2 faucet output |
| D13 | 2026-09-03 | Separate package.json for Solana workspace | Anchor tests need @coral-xyz/anchor, mocha, chai — separate from root package.json |
| D14 | 2026-09-03 | pda_seeds/signer_seeds take byte refs not u64 | Rust lifetime E0515: to_le_bytes() creates temporary — caller owns the bytes |
| D15 | 2026-09-04 | pub use glob re-export for Anchor macro | #[program] macro generates code referencing crate::__client_accounts_* — glob re-export brings these to crate root |
| D16 | 2026-09-04 | idl-build feature enables anchor-spl/idl-build | Anchor 0.31 IDL generation requires idl-build on both anchor-lang AND anchor-spl — program feature propagates |
| D17 | 2026-09-04 | escrow_ata uses init not init_if_needed | New escrow always creates new ATA — init_if_needed requires cargo feature and is unnecessary here |
| D18 | 2026-09-04 | Refund uses constraint not has_one for depositor check | has_one requires matching field name in Accounts struct — constraint is more flexible when account field name differs (signer vs depositor) |
| D19 | 2026-09-04 | Refund: immutable borrow for CPI, then mutable for status | Rust borrow checker E0502: can't borrow escrow_pda as mutable and immutable simultaneously — split into two phases |
| D20 | 2026-09-04 | Release: beneficiary_ata authority = escrow_pda.beneficiary | ATA derived from escrow state field, not signer — allows any authorized signer (beneficiary or resolver) to release |
| D21 | 2026-09-04 | Release: constraint allows beneficiary OR resolver | `signer == beneficiary || signer == resolver` — both roles can trigger release |
| D22 | 2026-09-04 | Keep escrow ATA open after release/refund | Audit trail — rent reclaim via close can be added later if needed |
| D23 | 2026-09-04 | Validator needs --clone-feature-set for SBPF v2 | solana-program v2.3.0 (via anchor-lang 0.31.1) emits SBPF v2 bytecode — test-validator 4.2.2 needs feature gates from mainnet to accept it |
| D24 | 2026-09-04 | Derive escrow ATA address, don't pre-create | Program's `init` constraint creates the ATA — pre-creating with getOrCreateAssociatedTokenAccount causes "Provided owner is not allowed" error |
| D25 | 2026-09-04 | Read token balance via getAccountInfo raw bytes | getTokenAccountBalance fails on empty/non-existent accounts — getAccountInfo + readBigUInt64LE(64) is more robust |
| D26 | 2026-09-04 | Separate confirmed connection for getTransaction | Provider defaults to "processed" commitment but getTransaction requires "confirmed" — created second Connection object |
| D27 | 2026-09-04 | Event verification via "Program data:" log prefix | Anchor events are base64-encoded in "Program data:" log lines — event name not visible as literal text |
