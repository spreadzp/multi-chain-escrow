# SLICE-09-3: Release + Refund Implementation

## User Story

Как beneficiary, я хочу вызвать `releaseEscrow` чтобы получить токены. Как depositor, я хочу вызвать `refundEscrow` чтобы вернуть токены из created escrow.

## Context

- Contract functions `release` и `refund` из EPIC-07
- `release` — перевод токенов beneficiary, только из статуса created
- `refund` — возврат токенов depositor, только из статуса created
- Транзакции подписываются через Freighter wallet
- Зависимости: SLICE-09-2 (create implementation)

## Deliverables

- `release.ts` — `releaseEscrow` method
- `refund.ts` — `refundEscrow` method
- Вызов contract functions через Soroban SDK
- Маппинг contract response → обновлённый `Escrow`

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `fe/src/adapters/stellar/release.ts` | Create | `releaseEscrow` method |
| `fe/src/adapters/stellar/refund.ts` | Create | `refundEscrow` method |
| `fe/src/adapters/stellar/index.ts` | Edit | Wire release + refund methods |

## Acceptance Criteria

- [ ] `releaseEscrow` вызывает contract `release`, токены beneficiary
- [ ] `refundEscrow` вызывает contract `refund`, возврат токенов depositor
- [ ] Оба метода подписываются через Freighter
- [ ] Возвращают обновлённый `Escrow` с новым статусом
- [ ] Unit tests: mock contract calls return correct statuses

## TDD Workflow

1. **Red:** Write tests — `releaseEscrow` and `refundEscrow` call correct contract functions, return updated Escrow
2. **Green:** Implement both methods with Soroban SDK contract calls, wallet signing
3. **Refactor:** Share transaction submission logic between release and refund
