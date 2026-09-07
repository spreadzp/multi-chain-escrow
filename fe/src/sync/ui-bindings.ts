"use client";

import { useEffect, useRef } from "react";
import { useWalletStore } from "@/features/wallet/wallet-store";
import { adapterRegistry } from "@/features/escrow/adapter/registry";
import { useEscrowStore } from "@/features/escrow/escrow-store";
import type { ChainId } from "@/shared/types";
import {
  startSyncOnConnect,
  stopSync,
  handleChainSwitch,
  type SyncLifecycle,
} from "./lifecycle";

export function useSyncAutoRefresh(): void {
  const session = useWalletStore((s) => s.session);
  const activeChainId = useWalletStore((s) => s.activeChainId);
  const lifecycleRef = useRef<SyncLifecycle | null>(null);
  const prevChainRef = useRef<ChainId | null>(null);

  useEffect(() => {
    if (!session) {
      // Disconnected — stop sync
      stopSync(lifecycleRef.current);
      lifecycleRef.current = null;
      prevChainRef.current = null;
      return;
    }

    const adapter = adapterRegistry.getAdapter(session.chainId);
    if (!adapter) return;

    if (prevChainRef.current !== null && prevChainRef.current !== session.chainId) {
      // Chain switch — restart sync
      lifecycleRef.current = handleChainSwitch(
        lifecycleRef.current,
        session,
        adapter,
      );
    } else {
      // Initial connect
      lifecycleRef.current = startSyncOnConnect(session, adapter);
    }

    prevChainRef.current = session.chainId;

    return () => {
      stopSync(lifecycleRef.current);
      lifecycleRef.current = null;
    };
  }, [session, activeChainId]);
}

export function useSyncStatus(): {
  loading: boolean;
  error: string | null;
} {
  const loading = useEscrowStore((s) => s.loading);
  const error = useEscrowStore((s) => s.error);
  return { loading, error };
}

export function useEscrowsForActiveChain() {
  const byId = useEscrowStore((s) => s.byId);
  const activeChainId = useWalletStore((s) => s.activeChainId);

  return Object.values(byId)
    .filter((e) => e.chainId === activeChainId)
    .sort((a, b) => b.createdAt - a.createdAt);
}
