# SLICE-09-4: List + Get (Contract Storage Iteration)

## User Story

Как пользователь, я хочу получить список своих escrows и детальную информацию по конкретному escrow, чтобы видеть свои депозиты в UI.

## Context

- EPIC-07 D11: storage keys `Escrow(nonce)` with `DataKey::Counter`
- `listEscrowsByUser` — итерация 0..counter, фильтрация по depositor address
- `getEscrow` — чтение contract storage по id
- Soroban contract storage reading через SDK
- Маппинг Soroban types → доменные `Escrow`
- Зависимости: SLICE-09-3 (release + refund implementation)

## Deliverables

- `query.ts` — `listEscrowsByUser` + `getEscrow` methods
- Итерация contract storage (0..counter)
- Фильтрация по depositor
- Маппинг Soroban data → `Escrow`

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `fe/src/adapters/stellar/query.ts` | Create | `listEscrowsByUser` + `getEscrow` |
| `fe/src/adapters/stellar/index.ts` | Edit | Wire query methods |

## Acceptance Criteria

- [ ] `listEscrowsByUser` итерирует 0..counter, фильтрует по depositor
- [ ] `getEscrow` читает contract storage по id
- [ ] Soroban types корректно маппятся в доменные `Escrow`
- [ ] Возвращает `Escrow[]` / `Escrow`
- [ ] Unit tests: mock storage returns correct escrows

## TDD Workflow

1. **Red:** Write tests — `listEscrowsByUser` iterates storage, filters by depositor; `getEscrow` reads by id
2. **Green:** Implement contract storage reading, iteration, filtering, mapping
3. **Refactor:** Extract Soroban→domain mapping to shared helper
