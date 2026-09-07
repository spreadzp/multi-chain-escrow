import type { EscrowAdapter, EscrowEvent } from "@/shared/types";
import { applyEventToStore, reconcileEventWithState } from "./store-integration";
import { useEscrowStore } from "@/features/escrow/escrow-store";

export interface EventSubscriptionContext {
  adapter: EscrowAdapter;
}

export function startEventSubscription(
  ctx: EventSubscriptionContext,
): () => void {
  const { adapter } = ctx;

  const cleanup = adapter.subscribeEvents((event: EscrowEvent) => {
    const store = useEscrowStore.getState();
    const knownEscrows = store.byId;

    if (reconcileEventWithState(event, knownEscrows)) {
      applyEventToStore(event);
    }
  });

  return cleanup;
}
