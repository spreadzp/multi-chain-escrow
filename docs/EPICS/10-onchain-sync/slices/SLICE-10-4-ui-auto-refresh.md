# SLICE-10-4: UI Auto-Refresh on Sync

## User Story

Как пользователь, я хочу чтобы UI автоматически обновлялся при on-chain изменениях без ручного refresh.

## Context

- UI реагирует на Zustand store changes через subscriptions
- Escrow list, statuses, events обновляются через sync layer
- Zustand `subscribe` или React hooks для reactive updates
- Зависимости: SLICE-10-3 (sync lifecycle)

## Deliverables

- UI components подписываются на store changes
- Escrow list auto-updates при poll refresh
- Status badges обновляются при event patch
- Loading/error states при sync операциях

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `fe/src/sync/ui-bindings.ts` | Create | Store subscriptions for UI components |

## Acceptance Criteria

- [ ] UI обновляется при store changes без ручного refresh
- [ ] Escrow list auto-updates при poll
- [ ] Status badges обновляются при events
- [ ] Loading state во время sync
- [ ] Unit test: store subscription triggers UI update

## TDD Workflow

1. **Red:** Write test — store change triggers UI re-render
2. **Green:** Implement store subscriptions, wire to UI components
3. **Refactor:** Ensure minimal re-renders, selector optimization
