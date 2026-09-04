# SLICE-09-6: Integration Tests on Local Network

## User Story

Как разработчик, я хочу запустить integration tests на local Stellar network с deployнутым контрактом, чтобы убедиться что адаптер работает end-to-end.

## Context

- Local Stellar network запущен (EPIC-05)
- Контракт deployнут (EPIC-07-7)
- Все методы адаптера реализованы (09-1..09-5)
- Тесты повторяют patterns из EPIC-08-6 (Solana integration tests)
- Зависимости: SLICE-09-5 (event parsing + subscribeEvents)

## Deliverables

- Integration test suite в `fe/src/adapters/stellar/__tests__/`
- Happy paths: create→release, create→refund
- Role denial tests
- Status transition error tests
- Event verification tests

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `fe/src/adapters/stellar/__tests__/integration.test.ts` | Create | Full integration test suite |

## Acceptance Criteria

- [ ] create→release happy path проходит
- [ ] create→refund happy path проходит
- [ ] Role denial: non-beneficiary cannot release
- [ ] Role denial: non-depositor cannot refund
- [ ] Status transition errors: cannot release refunded escrow
- [ ] Events корректно парсятся в integration context
- [ ] Все тесты проходят на local network

## TDD Workflow

1. **Red:** Write integration tests — happy paths, role denial, status errors, event verification
2. **Green:** Run against local network, fix adapter issues found
3. **Refactor:** Extract test helpers (setup escrow, wait for tx confirmation)
