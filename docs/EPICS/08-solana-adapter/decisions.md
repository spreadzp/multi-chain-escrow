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
| D15 | 2026-09-04 | `program.methods` cast to `any` | TS2589 deep type instantiation with `Program<any>` on method calls |
| D16 | 2026-09-04 | Nonce = `new BN(Date.now())` | Timestamp-based for uniqueness; passed as both BN (instruction arg) and BigInt (PDA seed) |
| D17 | 2026-09-04 | `@vitest-environment node` for crypto tests | jsdom lacks Buffer/crypto globals needed by `findProgramAddressSync` and `getAssociatedTokenAddressSync` |
| D18 | 2026-09-04 | `getMintFromEscrow` fetches mint from on-chain account | release/refund need mint for ATA derivation; fetch from escrowAccount via `program.account.escrowAccount.fetch` |
| D19 | 2026-09-04 | Depositor at offset 8 for memcmp | 8-byte discriminator + 32-byte depositor pubkey; `getProgramAccounts` filter |
| D20 | 2026-09-04 | `fetchEscrowAccount` returns null on error | Graceful handling for non-existent accounts; catch block returns null |
| D21 | 2026-09-04 | Event discriminators via `sha256("event:<EventName>")[0:8]` | Anchor convention for `#[event]` struct discriminators |
| D22 | 2026-09-04 | `connection.onLogs` for event subscription | Real-time log monitoring with "confirmed" commitment; parse "Program data:" entries |
| D23 | 2026-09-04 | `setKeypair` method for integration tests | Allows passing real signer keypair; `getProgram` uses it instead of random Keypair |
| D24 | 2026-09-04 | `escrowAccount` camelCase for Anchor coder | Anchor 0.31 uses camelCase account names in `coder.accounts.decode()` |
| D25 | 2026-09-04 | `tx.sign(keypair)` rest params for wallet | `sign(...signers: Array<Signer>)` — pass single keypair, not array |
| D23 | 2026-09-04 | `setKeypair` method for integration tests | Adapter needs real signer keypair for tx signing; `setWalletAddress` only sets address |
| D24 | 2026-09-04 | `escrowAccount` camelCase for coder.decode | Anchor 0.31 uses camelCase in `program.coder.accounts.decode()`, not PascalCase from IDL |
| D25 | 2026-09-04 | `signTransaction` casts tx to `any` | Type intersection `Signer & Signer[]` in web3.js makes typing impossible; runtime works with `tx.sign(keypair)` |
