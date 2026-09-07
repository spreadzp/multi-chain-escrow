"use client";

import { useEffect } from "react";
import { useEscrowAdapter } from "./useEscrowAdapter";
import { useWalletStore } from "@/features/wallet/wallet-store";

export function useAddressSync(): void {
  const adapter = useEscrowAdapter();
  const session = useWalletStore((s) => s.session);

  useEffect(() => {
    if (!adapter) {
      return;
    }

    adapter.setWalletAddress(session?.address ?? "");
  }, [adapter, session]);
}
