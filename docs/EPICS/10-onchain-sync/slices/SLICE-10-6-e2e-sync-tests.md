# SLICE-10-6: E2E Sync Tests (Both Chains)

## User Story

Как разработчик, я хочу запустить E2E sync tests для обеих цепочек, чтобы убедиться что sync layer работает корректно с реальными адаптерами.

## Context

- Both Solana и Stellar adapters реализуют EscrowAdapter
- Sync layer chain-agnostic — тестируется через adapter interface
- Local networks запущены (EPIC-05, EPIC-07)
- Зависимости: SLICE-10-4 (UI auto-refresh), SLICE-10-5 (error handling)

## Deliverables

- E2E test suite в `fe/src/sync/__tests__/`
- Happy paths: create→sync→store update, event→store patch
- Chain switch test
- Error scenarios test

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `fe/src/sync/__tests__/e2e-sync.test.ts` | Create | E2E sync test suite for both chains |

## Acceptance Criteria

- [ ] create→sync→store update проходит для Solana
- [ ] create→sync→store update проходит для Stellar
- [ ] event→store patch работает для обеих цепочек
- [ ] Chain switch корректно перезапускает sync
- [ ] Error scenarios: network unavailable → store.error
- [ ] Все тесты проходят

## TDD Workflow

1. **Red:** Write E2E tests — happy paths for both chains, chain switch, error scenarios
2. **Green:** Run against local networks, fix sync issues found
3. **Refactor:** Extract test helpers (setup adapter, wait for sync, assert store state)
