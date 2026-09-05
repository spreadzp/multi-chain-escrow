# EPIC-10: On-Chain Sync & Event Listening

## Overview

Синхронизация on-chain состояния с UI: poll-based загрузка escrow списков, event listening для статусов, обновление Zustand store при on-chain изменениях. Работает для обеих цепочек.

## Architecture Context

Poll loop в `fe/src/sync/` — периодически запрашивает `adapter.listEscrowsByUser()` и обновляет store. Event subscription через `adapter.subscribeEvents()` (polling, 2s — обе цепочки). Store обновляется через `syncActions`. UI реагирует на store changes. Sync layer chain-agnostic — использует только `EscrowAdapter` интерфейс.

## Repo

Коммиты → `fe/` репозиторий. См. `docs/intro/repo-conventions.md`.

## Slices

| Slice | Title | Effort | Depends on | Status |
|-------|-------|--------|------------|--------|
| 10-1 | Sync manager scaffold + poll loop | 1.5h | 08-6, 09-6, 03-6 | To Do |
| 10-2 | Event subscription + store integration (syncActions) | 2h | 10-1 | To Do |
| 10-3 | Sync lifecycle (connect/reload/chain switch) | 1.5h | 10-2 | To Do |
| 10-4 | UI auto-refresh on sync | 1h | 10-3 | To Do |
| 10-5 | Error handling + retries | 1h | 10-3 | To Do |
| 10-6 | E2E sync tests (both chains) | 2h | 10-4, 10-5 | To Do |

## Critical Path

```text
08-6 + 09-6 + 03-6 → 10-1 → 10-2 → 10-3 → {10-4, 10-5} → 10-6
```

## Key Files

| File | Purpose |
|------|---------|
| `fe/src/sync/manager.ts` | Sync manager — start/stop, poll loop |
| `fe/src/sync/events.ts` | Event subscription via adapter.subscribeEvents |
| `fe/src/sync/store-integration.ts` | syncActions → Zustand store, event vs state reconciliation |
| `fe/src/sync/lifecycle.ts` | Connect/reload/chain switch handling |
| `fe/src/sync/__tests__/` | Unit + E2E sync tests |

## Verification Checklist

- [ ] Sync manager запускается и останавливается
- [ ] Poll loop вызывает `adapter.listEscrowsByUser` периодически
- [ ] Event subscription через `adapter.subscribeEvents` (polling, 2s)
- [ ] Store обновляется при on-chain изменениях
- [ ] Sync при connect — refresh list для адреса
- [ ] Sync при reload — RPC запрос
- [ ] Sync при chain switch — restart sync loop
- [ ] Event vs state: on-chain state приоритет, events patch store
- [ ] Error handling: таймауты, «сеть недоступна», без падения UI
- [ ] UI auto-refresh работает
- [ ] E2E тесты проходят для обеих цепочек
