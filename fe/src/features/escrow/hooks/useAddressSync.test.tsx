import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWalletStore } from "@/features/wallet/wallet-store";
import { adapterRegistry } from "../adapter/registry";
import type { EscrowAdapter, ChainId } from "@/shared/types";
import { useAddressSync } from "./useAddressSync";

const CHAIN_ID: ChainId = "solana-devnet";

function makeMockAdapter(): EscrowAdapter {
  return {
    chainId: CHAIN_ID,
    createEscrow: vi.fn().mockResolvedValue({ escrowId: "e1", txHash: "tx1" }),
    releaseEscrow: vi.fn().mockResolvedValue({ txHash: "tx1" }),
    refundEscrow: vi.fn().mockResolvedValue({ txHash: "tx1" }),
    getEscrow: vi.fn().mockResolvedValue(null),
    listEscrowsByUser: vi.fn().mockResolvedValue([]),
    subscribeEvents: vi.fn().mockReturnValue(() => {}),
    setWalletAddress: vi.fn(),
  };
}

function setup(adapter?: EscrowAdapter) {
  useWalletStore.setState({
    activeChainId: CHAIN_ID,
    session: {
      address: "0xWallet",
      chainId: CHAIN_ID,
      connectedAt: Date.now(),
    },
    status: "connected",
    error: null,
  });
  adapterRegistry.clear();
  adapterRegistry.register(CHAIN_ID, adapter ?? makeMockAdapter());
}

function resetStores() {
  adapterRegistry.clear();
  useWalletStore.setState({
    activeChainId: null,
    session: null,
    status: "disconnected",
    error: null,
  });
}

describe("useAddressSync", () => {
  let unmountFn: (() => void) | null = null;

  afterEach(() => {
    if (unmountFn) {
      unmountFn();
      unmountFn = null;
    }
    resetStores();
  });

  it("calls adapter.setWalletAddress with session address on mount", () => {
    const adapter = makeMockAdapter();
    setup(adapter);

    const { unmount } = renderHook(() => useAddressSync());
    unmountFn = unmount;

    expect(adapter.setWalletAddress).toHaveBeenCalledWith("0xWallet");
  });

  it("calls adapter.setWalletAddress('') when session is null", () => {
    const adapter = makeMockAdapter();
    setup(adapter);
    useWalletStore.setState({ session: null, status: "disconnected" });

    const { unmount } = renderHook(() => useAddressSync());
    unmountFn = unmount;

    expect(adapter.setWalletAddress).toHaveBeenCalledWith("");
  });

  it("calls setWalletAddress when session address changes", () => {
    const adapter = makeMockAdapter();
    setup(adapter);

    const { unmount, rerender } = renderHook(() => useAddressSync());
    unmountFn = unmount;

    expect(adapter.setWalletAddress).toHaveBeenCalledWith("0xWallet");

    useWalletStore.setState({
      session: {
        address: "0xNewWallet",
        chainId: CHAIN_ID,
        connectedAt: Date.now(),
      },
    });

    rerender();

    expect(adapter.setWalletAddress).toHaveBeenCalledWith("0xNewWallet");
    expect(adapter.setWalletAddress).toHaveBeenCalledTimes(2);
  });

  it("re-syncs when adapter changes (chain switch)", () => {
    const adapter1 = makeMockAdapter();
    setup(adapter1);

    const { unmount, rerender } = renderHook(() => useAddressSync());
    unmountFn = unmount;

    expect(adapter1.setWalletAddress).toHaveBeenCalledWith("0xWallet");

    const CHAIN_ID_2: ChainId = "stellar-testnet";
    const adapter2 = makeMockAdapter();
    adapter2.chainId = CHAIN_ID_2;
    adapterRegistry.register(CHAIN_ID_2, adapter2);
    useWalletStore.setState({ activeChainId: CHAIN_ID_2 });

    rerender();

    expect(adapter2.setWalletAddress).toHaveBeenCalledWith("0xWallet");
  });

  it("no-op when adapter is null", () => {
    adapterRegistry.clear();
    useWalletStore.setState({
      activeChainId: null,
      session: {
        address: "0xWallet",
        chainId: CHAIN_ID,
        connectedAt: Date.now(),
      },
      status: "connected",
      error: null,
    });

    const { unmount } = renderHook(() => useAddressSync());
    unmountFn = unmount;

    // No adapter → no setWalletAddress call possible
    // Hook should not throw
    expect(true).toBe(true);
  });

  it("does not call setWalletAddress on unmount", () => {
    const adapter = makeMockAdapter();
    setup(adapter);

    const { unmount } = renderHook(() => useAddressSync());
    unmountFn = null;

    unmount();

    // setWalletAddress was called once on mount, not on unmount
    expect(adapter.setWalletAddress).toHaveBeenCalledTimes(1);
  });

  it("syncs empty string on mount when session is null and adapter exists", () => {
    const adapter = makeMockAdapter();
    adapterRegistry.clear();
    adapterRegistry.register(CHAIN_ID, adapter);
    useWalletStore.setState({
      activeChainId: CHAIN_ID,
      session: null,
      status: "disconnected",
      error: null,
    });

    const { unmount } = renderHook(() => useAddressSync());
    unmountFn = unmount;

    expect(adapter.setWalletAddress).toHaveBeenCalledWith("");
  });
});
