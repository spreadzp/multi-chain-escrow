import type { Escrow, EscrowEvent, EscrowStatus, ChainId } from "@/shared/types";
import { useEscrowStore, escrowKey } from "@/features/escrow/escrow-store";

const EVENT_STATUS_MAP: Record<string, EscrowStatus> = {
  Deposited: "created",
  Released: "released",
  Refunded: "refunded",
};

export function applyEventToStore(event: EscrowEvent): void {
  const store = useEscrowStore.getState();

  // Add event to store
  store.addEvent(event);

  // Patch escrow status if applicable
  const status = EVENT_STATUS_MAP[event.type];
  if (status) {
    store.patchStatus(event.escrowId, event.chainId, status);
  }
}

export function applyEscrowsToStore(
  escrows: Escrow[],
  chainId: ChainId,
): void {
  const store = useEscrowStore.getState();

  // Full refresh: on-chain state is truth (D9)
  // Only replace escrows for this chain, preserve other chains
  const otherChainEntries = Object.entries(store.byId).filter(
    ([key]) => !key.startsWith(`${chainId}:`),
  );

  const newEntries = escrows.map((e) => [escrowKey(e.chainId, e.id), e] as const);

  // Use setEscrows for the full list, but we need to preserve other chains
  // So we manually merge
  useEscrowStore.setState({
    byId: {
      ...Object.fromEntries(otherChainEntries),
      ...Object.fromEntries(newEntries),
    },
  });
}

export function reconcileEventWithState(
  event: EscrowEvent,
  knownEscrows: Record<string, Escrow>,
): boolean {
  // Returns true if event should be applied
  // Event is only applied if we know about the escrow (it exists in store)
  // or if it's a Deposited event (new escrow creation)
  const key = escrowKey(event.chainId, event.escrowId);
  if (event.type === "Deposited") {
    return true;
  }
  return key in knownEscrows;
}
