import { create } from "zustand";
import type { ChainId, WalletSession, WalletStatus } from "@/shared/types";

interface WalletState {
  activeChainId: ChainId | null;
  session: WalletSession | null;
  status: WalletStatus;
  error: string | null;

  setChain: (chainId: ChainId) => void;
  setConnecting: () => void;
  setConnected: (session: WalletSession) => void;
  setError: (message: string) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  activeChainId: null,
  session: null,
  status: "disconnected",
  error: null,

  setChain: (chainId) =>
    set({
      activeChainId: chainId,
      session: null,
      status: "disconnected",
      error: null,
    }),

  setConnecting: () =>
    set({
      status: "connecting",
      error: null,
    }),

  setConnected: (session) =>
    set({
      session,
      status: "connected",
      error: null,
    }),

  setError: (message) =>
    set({
      status: "error",
      error: message,
    }),

  disconnect: () =>
    set({
      session: null,
      status: "disconnected",
      error: null,
    }),
}));
