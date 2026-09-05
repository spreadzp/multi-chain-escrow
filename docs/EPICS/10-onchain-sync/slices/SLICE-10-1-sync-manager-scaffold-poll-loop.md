# SLICE-10-1: Sync Manager Scaffold + Poll Loop

## User Story

Как разработчик, я хочу создать sync manager с poll loop, который периодически запрашивает `adapter.listEscrowsByUser()` и обновляет store, чтобы UI отображал актуальные on-chain данные.

## Context

- Sync layer chain-agnostic — использует только `EscrowAdapter` интерфейс
- `fe/src/sync/` — monorepo convention (D4)
- Adapters (EPIC-08, EPIC-09) уже реализуют `listEscrowsByUser` и `subscribeEvents`
- Zustand store из EPIC-03-3
- `useEscrowAdapter` из EPIC-03-4 для резолва адаптера
- Зависимости: EPIC-08-6, EPIC-09-6, EPIC-03-6

## Deliverables

- `manager.ts` — SyncManager class (singleton)
- `start(adapter, address)` / `stop()` methods
- Poll loop: `adapter.listEscrowsByUser(address)` каждые 5s
- Обновление store через syncActions

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `fe/src/sync/manager.ts` | Create | SyncManager singleton — start/stop, poll loop |
| `fe/src/sync/types.ts` | Create | Internal types for sync state |

## Acceptance Criteria

- [ ] SyncManager — singleton, start/stop methods
- [ ] Poll loop вызывает `adapter.listEscrowsByUser` каждые 5s
- [ ] Chain-agnostic — работает через EscrowAdapter интерфейс
- [ ] Stop очищает interval
- [ ] Unit test: start/stop, poll calls adapter

## TDD Workflow

1. **Red:** Write test — SyncManager starts poll loop, calls adapter.listEscrowsByUser, stops cleanly
2. **Green:** Implement SyncManager with setInterval poll, start/stop
3. **Refactor:** Extract types to `types.ts`, ensure singleton pattern
