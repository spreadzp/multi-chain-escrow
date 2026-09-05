# SLICE-10-3: Sync Lifecycle (Connect/Reload/Chain Switch)

## User Story

Как пользователь, я хочу чтобы sync автоматически запускался при connect кошелька, перезапускался при смене сети и восстанавливался после reload страницы.

## Context

- Connect → refresh list для адреса (slices.md E9 item 4)
- Reload → RPC запрос (slices.md E9 item 5)
- Chain switch → restart sync loop (D8)
- Store не источник правды — on-chain state приоритет
- Wallet session из EPIC-02, chain switch из EPIC-02
- Зависимости: SLICE-10-2 (event subscription + store integration)

## Deliverables

- `lifecycle.ts` — sync lifecycle handlers
- Connect handler: start sync + refresh list
- Reload handler: RPC запрос через adapter
- Chain switch handler: stop current sync + restart with new adapter

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `fe/src/sync/lifecycle.ts` | Create | Connect/reload/chain switch handlers |

## Acceptance Criteria

- [ ] Connect → start sync + refresh list для адреса
- [ ] Reload → RPC запрос через adapter
- [ ] Chain switch → stop current sync, restart with new adapter
- [ ] Store не источник правды — on-chain state приоритет
- [ ] Unit tests: lifecycle handlers trigger correct sync actions

## TDD Workflow

1. **Red:** Write tests — connect starts sync, chain switch restarts, reload triggers RPC
2. **Green:** Implement lifecycle handlers wired to wallet session changes
3. **Refactor:** Ensure clean stop/start transitions, no duplicate sync loops
