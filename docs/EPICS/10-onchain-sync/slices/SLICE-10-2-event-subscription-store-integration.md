# SLICE-10-2: Event Subscription + Store Integration (syncActions)

## User Story

Как UI разработчик, я хочу подписаться на escrow events через адаптер и обновлять Zustand store при on-chain изменениях, чтобы UI реагировал без ручного refresh.

## Context

- `adapter.subscribeEvents(callback)` уже реализован в EPIC-08-5 и EPIC-09-5 (polling 2s)
- syncActions обновляют Zustand store (EPIC-03-3)
- Event vs state: on-chain state приоритет, events patch store инкрементально (D9)
- Зависимости: SLICE-10-1 (sync manager scaffold)

## Deliverables

- `events.ts` — event subscription через `adapter.subscribeEvents`
- `store-integration.ts` — syncActions → Zustand store
- Event vs state reconciliation: events patch, full refresh overrides

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `fe/src/sync/events.ts` | Create | Event subscription via adapter.subscribeEvents |
| `fe/src/sync/store-integration.ts` | Create | syncActions → store, event vs state reconciliation |

## Acceptance Criteria

- [ ] `adapter.subscribeEvents(callback)` подписывается на events
- [ ] Events обновляют store через syncActions
- [ ] Event vs state: on-chain state приоритет при full refresh
- [ ] Events patch store инкрементально (не перезаписывают весь list)
- [ ] Unit tests: event callback updates store, state reconciliation

## TDD Workflow

1. **Red:** Write tests — subscribeEvents callback updates store, event vs state priority
2. **Green:** Implement event subscription, syncActions, reconciliation logic
3. **Refactor:** Extract reconciliation logic to shared helper
