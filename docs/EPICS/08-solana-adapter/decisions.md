# EPIC-08: Solana Adapter Implementation — Decisions Log

## Decisions

| ID | Date | Decision | Rationale |
|----|------|----------|-----------|
| D1 | — | @coral-xyz/anchor for client | Type-safe IDL binding |
| D2 | — | Adapter wraps Program methods | Maps to EscrowAdapter interface |
| D3 | — | Event parsing from logs | Anchor events in transaction logs |
| D4 | 2026-09-02 | fe/ prefix for all adapter files | Monorepo convention — fe/src/adapters/solana/ |
| D5 | 2026-09-02 | Single createEscrow method | Matches EPIC-06 single create_escrow instruction |
| D6 | 2026-09-02 | No deposit method | Not in EscrowAdapter interface — deposit inside createEscrow |
| D7 | 2026-09-02 | 08-1 depends on 02-4 (Phantom) | Adapter needs wallet for transaction signing |
| D8 | 2026-09-02 | listEscrowsByUser via getProgramAccounts | memcmp filter on depositor — simplest for demo |
| D9 | 2026-09-02 | subscribeEvents polling-based | 2s interval — simpler than websocket for local validator |
| D10 | 2026-09-02 | Events as separate slice (08-5) | Anchor log parsing non-trivial — decode base64, match event name |
| D11 | 2026-09-02 | One file per method | create.ts, release.ts, refund.ts, query.ts, events.ts — mirrors EPIC-06/07 |
| D12 | 2026-09-04 | IDL cast to `any` for Anchor 0.31 | Anchor's strict `Idl` type doesn't match JSON-imported IDL; standard workaround with `Program<any>` |
| D13 | 2026-09-04 | `tx.sign` cast to bypass `Signer & Signer[]` | @solana/web3.js v1.98 has intersection type quirk; cast tx to `{ sign: (s: unknown[]) => void }` |
| D14 | 2026-09-04 | Wallet requires `payer` field | Anchor 0.31 `Wallet` type extends `NodeWallet` which requires `payer: Keypair` |
