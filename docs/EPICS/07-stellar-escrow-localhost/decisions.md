# EPIC-07: Stellar Escrow on Localhost — Decisions Log

## Decisions

| ID | Date | Decision | Rationale |
|----|------|----------|-----------|
| D1 | — | Soroban SDK for Stellar contract | Standard smart contract platform |
| D2 | — | Storage keys for escrow data | Soroban persistent storage |
| D3 | — | SAC (Stellar Asset Contract) for tokens | Native token standard on Stellar |
| D4 | 2026-09-02 | Single create_escrow function | Storage + SAC transfer in one call — simpler flow |
| D5 | 2026-09-02 | Test SAC token in 07-6 test setup | Not a separate slice — part of test fixture |
| D6 | 2026-09-02 | Events in each function | `env.events().publish` — 2-3 lines, no separate slice |
| D7 | 2026-09-02 | 07-7 includes deploy + ABI + config | Deploy to local, copy ABI, update contracts.ts |
| D8 | 2026-09-02 | 07-1 depends on 05-4 (faucet) | Deploy and tests need funded accounts |
| D9 | 2026-09-02 | One file per function | create.rs, release.rs, refund.rs — mirrors EPIC-06 |
| D10 | 2026-09-02 | ABI path uses fe/ prefix | fe/src/config/stellar-abi.json — monorepo convention |
| D11 | 2026-09-02 | Storage: Escrow(nonce) key with DataKey::Counter | Enables list_escrows via 0..counter iteration |
| D12 | 2026-09-04 | soroban-sdk 28.0.0-rc.1 | Matches soroban-cli v28.0.0 — SDK 22 had rand_core incompatibility with ed25519-dalek |
| D13 | 2026-09-04 | crate-type = ["cdylib", "rlib"] | rlib needed for integration tests to import the crate — cdylib alone doesn't export for tests |
| D14 | 2026-09-04 | Integration tests in contracts/escrow/tests/ | Cargo looks for integration tests in crate's tests/ dir, not workspace root |
| D15 | 2026-09-04 | Storage access in tests requires env.as_contract() | Soroban persistent storage is only accessible within a contract context — wrap test storage calls with env.as_contract(&contract_id, \|\| { ... }) |
| D16 | 2026-09-04 | Token setup via register_stellar_asset_contract_v2 | SDK 28 API: env.register_stellar_asset_contract_v2(admin) returns StellarAssetContract with .address() and .issuer() |
| D17 | 2026-09-04 | Mint via StellarAssetClient, not TokenClient | TokenClient has transfer/balance but not mint — StellarAssetClient::new(env, token).mint(to, amount) for SAC minting |
| D18 | 2026-09-04 | Event verification deferred to 07-6 | SDK 28 events().all() returns empty in test context — needs investigation of diagnostic vs contract events; core functionality (storage, transfer, auth) verified |
