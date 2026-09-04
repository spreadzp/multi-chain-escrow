# EPIC-09: Stellar Adapter Implementation — Decisions Log

## Decisions

| ID | Date | Decision | Rationale |
|----|------|----------|-----------|
| D1 | — | @stellar/stellar-sdk for client | Official SDK, Soroban support |
| D2 | — | Adapter wraps contract methods | Maps to EscrowAdapter interface |
| D3 | — | Event parsing from transaction effects | Soroban events in meta |
| D4 | 2026-09-02 | fe/ prefix for all adapter files | Monorepo convention — fe/src/adapters/stellar/ |
| D5 | 2026-09-02 | Single createEscrow method | Matches EPIC-07 single create_escrow function |
| D6 | 2026-09-02 | No deposit method | Not in EscrowAdapter interface — SAC transfer inside createEscrow |
| D7 | 2026-09-02 | 09-1 depends on 02-4 (Freighter) | Adapter needs wallet for transaction signing |
| D8 | 2026-09-02 | listEscrowsByUser via contract storage iteration | Iterate 0..counter, filter by depositor — EPIC-07 D11 |
| D9 | 2026-09-02 | subscribeEvents polling-based | 2s interval — simpler than websocket for local network |
| D10 | 2026-09-02 | Events as separate slice (09-5) | Soroban event parsing from tx effects non-trivial |
| D11 | 2026-09-02 | One file per method | create.ts, release.ts, refund.ts, query.ts, events.ts — mirrors EPIC-06/07/08 |
| D12 | 2026-09-04 | `allowHttp: true` for local RPC | Stellar SDK refuses insecure HTTP without this flag; gated by `chain.isLocal` |
| D13 | 2026-09-04 | `setSignerSecret` for integration tests | Passes Keypair secret key for real signing; derives publicKey automatically |
| D14 | 2026-09-04 | Wallet check before stub throw | Ensures `getWalletAddress()` fires before "Not implemented" error in scaffold |
