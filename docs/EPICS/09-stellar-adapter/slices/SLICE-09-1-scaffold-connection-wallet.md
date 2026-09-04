# SLICE-09-1: Stellar Adapter Scaffold + Connection + Wallet

## User Story

Как разработчик, я хочу создать `StellarEscrowAdapter` class с подключением к local Stellar network и Freighter wallet, чтобы вызывать методы escrow контракта через единый `EscrowAdapter` интерфейс.

## Context

- Адаптер живёт в `fe/src/adapters/stellar/`
- Использует `@stellar/stellar-sdk` (Server, rpc)
- ABI загружается из `fe/src/config/stellar-abi.json` (экспорт из EPIC-07-7)
- RPC endpoint из `fe/src/config/chains.ts`
- Wallet (Freighter) из EPIC-02-4 — для подписания транзакций
- `EscrowAdapter` интерфейс определён в EPIC-03-6
- Зависимости: EPIC-07-7 (ABI + deploy), EPIC-03-6 (interface), EPIC-02-4 (wallet)

## Deliverables

- `StellarEscrowAdapter` class, имплементирующий `EscrowAdapter`
- `connection.ts` — Server setup, wallet load, ABI load
- `index.ts` — export class
- `setWalletAddress` method — прокидывает адрес из EPIC-02 session

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `fe/src/adapters/stellar/index.ts` | Create | Class export |
| `fe/src/adapters/stellar/connection.ts` | Create | Server + wallet + ABI load |
| `fe/src/adapters/stellar/types.ts` | Create | Internal types for contract interaction |

## Acceptance Criteria

- [ ] `StellarEscrowAdapter` имплементирует `EscrowAdapter` интерфейс
- [ ] Server подключается к local Stellar network из `chains.ts`
- [ ] ABI загружается из `stellar-abi.json`
- [ ] `setWalletAddress` сохраняет адрес для подписания
- [ ] Class экспортируется из `index.ts`
- [ ] Unit test: scaffold creates instance without errors

## TDD Workflow

1. **Red:** Write test — `StellarEscrowAdapter` implements `EscrowAdapter`, Server connects, ABI loads
2. **Green:** Create minimal class with connection, ABI load, `setWalletAddress`
3. **Refactor:** Extract connection logic to `connection.ts`, types to `types.ts`
