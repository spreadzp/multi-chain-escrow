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
