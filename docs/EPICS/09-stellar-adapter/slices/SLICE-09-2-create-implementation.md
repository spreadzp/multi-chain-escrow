# SLICE-09-2: Create Implementation

## User Story

Как depositor, я хочу вызвать `createEscrow` через Stellar адаптер, чтобы создать escrow с SAC token transfer на local network.

## Context

- EPIC-07 D4: single `create_escrow` function (storage + SAC transfer in one call)
- SAC (Stellar Asset Contract) для токенов — native token standard
- Транзакция подписывается через Freighter wallet
- Контракт deployнут на local network (EPIC-07-7)
- Зависимости: SLICE-09-1 (scaffold + connection + wallet)

## Deliverables

- `create.ts` — `createEscrow` method
- Вызов contract `create_escrow` через Soroban SDK
- SAC token transfer внутри транзакции
- Маппинг contract response → доменный `Escrow`

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `fe/src/adapters/stellar/create.ts` | Create | `createEscrow` method |
| `fe/src/adapters/stellar/index.ts` | Edit | Wire create method |

## Acceptance Criteria

- [ ] `createEscrow` отправляет транзакцию на local network
- [ ] SAC tokens transfer внутри create
- [ ] Транзакция подписывается через Freighter
- [ ] Возвращает `Escrow` с on-chain id
- [ ] Unit test: mock contract call returns correct Escrow

## TDD Workflow

1. **Red:** Write test — `createEscrow` calls contract, returns Escrow with correct fields
2. **Green:** Implement `createEscrow` with Soroban SDK contract call, SAC transfer, wallet signing
3. **Refactor:** Extract contract call helpers, map response to domain type
