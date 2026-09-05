# EPIC-10: On-Chain Sync & Event Listening — Decisions Log

## Decisions

| ID | Date | Decision | Rationale |
|----|------|----------|-----------|
| D1 | — | ~~Polling for Solana events~~ → Replaced by D6 | Original decision superseded |
| D2 | — | ~~Soroban RPC for Stellar events~~ → Replaced by D6 | Original decision superseded |
| D3 | — | Sync manager as singleton | Single source of truth for UI updates |
| D4 | 2026-09-02 | fe/ prefix for all sync files | Monorepo convention — fe/src/sync/ |
| D5 | 2026-09-02 | Chain-agnostic sync layer | Adapters implement same EscrowAdapter interface — no chain-specific logic in sync |
| D6 | 2026-09-02 | No WebSocket — both adapters use polling | EPIC-08 D9 + EPIC-09 D9: subscribeEvents polling-based (2s). Replaces original D1/D2 |
| D7 | 2026-09-02 | Sync uses adapter.subscribeEvents + adapter.listEscrowsByUser | No direct RPC or WebSocket in sync layer |
| D8 | 2026-09-02 | Sync lifecycle: connect→refresh, reload→RPC, chain switch→restart | slices.md E9 items 4-5 |
| D9 | 2026-09-02 | Event vs state: on-chain state is truth | Events patch store, full refresh overrides — slices.md E9 item 6 |
| D10 | 2026-09-02 | Error handling: timeouts, "network unavailable", no UI crash | slices.md E9 item 7 |
| D11 | 2026-09-02 | One file per concern | manager.ts, events.ts, store-integration.ts, lifecycle.ts — mirrors EPIC-08/09 |
