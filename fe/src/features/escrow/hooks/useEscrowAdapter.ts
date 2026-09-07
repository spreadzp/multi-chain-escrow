"use client";

import { useWalletStore } from "@/features/wallet/wallet-store";
import { adapterRegistry } from "../adapter/registry";
import { EscrowAdapterError } from "../adapter/types";
import type { EscrowAdapter } from "@/shared/types";

export function useEscrowAdapter(): EscrowAdapter | null {
  const activeChainId = useWalletStore((s) => s.activeChainId);
  if (!activeChainId) return null;
  return adapterRegistry.getAdapter(activeChainId);
}

export function useEscrowAdapterSafe(): EscrowAdapter {
  const adapter = useEscrowAdapter();
  if (!adapter) {
    throw new EscrowAdapterError(
      "not_connected",
      "No escrow adapter available for the active chain",
    );
  }
  return adapter;
}
