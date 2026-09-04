# EPIC-09: Stellar Adapter Implementation

## Overview

`StellarEscrowAdapter` — реализация `EscrowAdapter` интерфейса для Stellar. Подключение к local network через `@stellar/stellar-sdk`, вызов контракта через Soroban, чтение contract storage. Маппинг on-chain данных в доменные типы `Escrow`.

## Architecture Context

Адаптер живёт в `fe/src/adapters/stellar/`. Использует ABI из EPIC-07 (`fe/src/config/stellar-abi.json`). Подключается к RPC из `fe/src/config/chains.ts`. Реализует все методы `EscrowAdapter`: `createEscrow`, `releaseEscrow`, `refundEscrow`, `getEscrow`, `listEscrowsByUser`, `subscribeEvents`, `setWalletAddress`. Транзакции подписываются через wallet из EPIC-02 (Freighter).

## Repo

Коммиты → `fe/` репозиторий. См. `docs/intro/repo-conventions.md`.

## Slices

| Slice | Title | Effort | Depends on | Status |
|-------|-------|--------|------------|--------|
| 09-1 | Stellar adapter scaffold + connection + wallet | 1.5h | 07-7, 03-6, 02-4 | To Do |
| 09-2 | create implementation | 1.5h | 09-1 | To Do |
| 09-3 | release + refund implementation | 2h | 09-2 | To Do |
| 09-4 | list + get (contract storage iteration) | 1.5h | 09-3 | To Do |
| 09-5 | Event parsing + subscribeEvents (polling) | 1.5h | 09-4 | To Do |
| 09-6 | Integration tests on local network | 2.5h | 09-5 | To Do |

## Critical Path

```text
07-7 + 03-6 + 02-4 → 09-1 → 09-2 → 09-3 → 09-4 → 09-5 → 09-6
```

## Key Files

| File | Purpose |
|------|---------|
| `fe/src/adapters/stellar/index.ts` | StellarEscrowAdapter class + export |
| `fe/src/adapters/stellar/connection.ts` | Server + wallet + ABI load |
| `fe/src/adapters/stellar/create.ts` | createEscrow method |
| `fe/src/adapters/stellar/release.ts` | releaseEscrow method |
| `fe/src/adapters/stellar/refund.ts` | refundEscrow method |
| `fe/src/adapters/stellar/query.ts` | listEscrowsByUser + getEscrow (contract storage) |
| `fe/src/adapters/stellar/events.ts` | Event parsing from tx effects + subscribeEvents polling |
| `fe/src/adapters/stellar/__tests__/` | Unit + integration tests |

## Verification Checklist

- [ ] `StellarEscrowAdapter` реализует все методы `EscrowAdapter`
- [ ] `createEscrow` отправляет транзакцию на local network, SAC tokens transfer
- [ ] `releaseEscrow` работает с реальным contract storage, токены beneficiary
- [ ] `refundEscrow` возвращает токены depositor (только из created)
- [ ] `listEscrowsByUser` итерирует contract storage (0..counter), фильтрует по depositor
- [ ] `getEscrow` читает contract storage по id
- [ ] Events корректно маппятся в `EscrowEvent` из transaction effects
- [ ] `subscribeEvents` — polling-based (2s interval)
- [ ] `setWalletAddress` прокидывает адрес из EPIC-02 session
- [ ] Транзакции подписываются через Freighter wallet
- [ ] Integration tests проходят на local network
