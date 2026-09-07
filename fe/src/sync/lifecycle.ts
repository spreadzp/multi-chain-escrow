import type { ChainId, EscrowAdapter, WalletSession } from "@/shared/types";
import { adapterRegistry } from "@/features/escrow/adapter/registry";
import { getSyncManager } from "./manager";
import { startEventSubscription, type EventSubscriptionContext } from "./events";

export interface SyncLifecycle {
  stop: () => void;
}

export function startSyncOnConnect(
  session: WalletSession,
  adapter: EscrowAdapter,
): SyncLifecycle {
  const manager = getSyncManager();

  // Set wallet address on adapter
  adapter.setWalletAddress(session.address);

  // Start poll loop
  manager.start(adapter, session.address);

  // Start event subscription
  const eventCleanup = startEventSubscription({ adapter });

  return {
    stop: () => {
      eventCleanup();
      manager.stop();
    },
  };
}

export function stopSync(lifecycle: SyncLifecycle | null): void {
  if (lifecycle) {
    lifecycle.stop();
  }
}

export function handleChainSwitch(
  currentLifecycle: SyncLifecycle | null,
  newSession: WalletSession,
  newAdapter: EscrowAdapter,
): SyncLifecycle {
  // Stop current sync
  stopSync(currentLifecycle);

  // Start fresh with new adapter
  return startSyncOnConnect(newSession, newAdapter);
}

export function handleReload(
  session: WalletSession | null,
): SyncLifecycle | null {
  if (!session) return null;

  const adapter = adapterRegistry.getAdapter(session.chainId);
  if (!adapter) return null;

  return startSyncOnConnect(session, adapter);
}

export function getAdapterForChain(chainId: ChainId): EscrowAdapter | null {
  return adapterRegistry.getAdapter(chainId);
}
