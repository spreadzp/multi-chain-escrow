# SLICE-10-5: Error Handling + Retries

## User Story

Как пользователь, я хочу чтобы при RPC ошибках UI показывал понятное сообщение «сеть недоступна» вместо падения всего приложения.

## Context

- Таймауты RPC, network errors (slices.md E9 item 7)
- Retry с backoff для transient errors
- Ошибки отображаются в store.error, не падают UI
- Зависимости: SLICE-10-3 (sync lifecycle)

## Deliverables

- Error boundary в sync layer
- Retry с exponential backoff для transient errors
- Понятные сообщения: «сеть недоступна», «таймаут»
- Store.error field для UI отображения

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `fe/src/sync/error-handling.ts` | Create | Error boundary, retry logic, user messages |

## Acceptance Criteria

- [ ] RPC таймаут → retry с backoff
- [ ] Network error → «сеть недоступна» в store.error
- [ ] UI не падает при sync ошибках
- [ ] Retry ограничен (max 3 attempts)
- [ ] Unit tests: error scenarios, retry logic

## TDD Workflow

1. **Red:** Write tests — RPC timeout triggers retry, network error sets store.error, UI survives
2. **Green:** Implement error handling wrapper, retry with backoff, store.error integration
3. **Refactor:** Extract retry logic to reusable helper
