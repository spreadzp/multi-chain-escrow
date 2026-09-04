# SLICE-09-5: Event Parsing + subscribeEvents (Polling)

## User Story

Как UI разработчик, я хочу подписаться на escrow events через адаптер, чтобы обновлять UI при on-chain изменениях без ручного refresh.

## Context

- Soroban events в transaction effects/meta
- Парсинг tx effects → `EscrowEvent` (Deposited, Released, Refunded)
- `subscribeEvents` — polling-based (2s interval), запрос последних tx effects
- D9: polling simpler than websocket for local network
- D10: events as separate slice — Soroban event parsing non-trivial
- Зависимости: SLICE-09-4 (list + get implementation)

## Deliverables

- `events.ts` — event parsing + `subscribeEvents` method
- Парсинг Soroban transaction effects → `EscrowEvent`
- Polling loop (2s interval) для обнаружения новых events
- Cleanup function для остановки polling

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `fe/src/adapters/stellar/events.ts` | Create | Event parsing + `subscribeEvents` |
| `fe/src/adapters/stellar/index.ts` | Edit | Wire events method |

## Acceptance Criteria

- [ ] Soroban tx effects корректно маппятся в `EscrowEvent`
- [ ] `subscribeEvents` запускает polling (2s interval)
- [ ] Polling обнаруживает новые events
- [ ] Cleanup function останавливает polling
- [ ] Unit tests: mock tx effects parsed correctly

## TDD Workflow

1. **Red:** Write tests — event parsing maps tx effects to EscrowEvent; subscribeEvents starts/stops polling
2. **Green:** Implement parser for Soroban effects, polling loop with setInterval, cleanup
3. **Refactor:** Extract event mapping logic, ensure polling cleanup is robust
