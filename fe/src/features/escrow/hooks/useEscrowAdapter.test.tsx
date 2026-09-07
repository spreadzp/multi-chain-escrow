import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWalletStore } from "@/features/wallet/wallet-store";
import { adapterRegistry } from "../adapter/registry";
import type { EscrowAdapter, ChainId } from "@/shared/types";
import { useEscrowAdapter, useEscrowAdapterSafe } from "./useEscrowAdapter";
import { EscrowAdapterError } from "../adapter/types";

function makeAdapter(chainId: ChainId): EscrowAdapter {
  return {
    chainId,
    createEscrow: async () => ({ escrowId: "e1", txHash: "tx1" }),
    releaseEscrow: async () => ({ txHash: "tx1" }),
    refundEscrow: async () => ({ txHash: "tx1" }),
    getEscrow: async () => null,
    listEscrowsByUser: async () => [],
    subscribeEvents: () => () => { },
    setWalletAddress: () => { },
  };
}

describe("useEscrowAdapter", () => {
  beforeEach(() => {
    useWalletStore.setState({
      activeChainId: null,
      session: null,
      status: "disconnected",
      error: null,
    });
    adapterRegistry.clear();
  });

  afterEach(() => {
    useWalletStore.setState({
      activeChainId: null,
      session: null,
      status: "disconnected",
      error: null,
    });
    adapterRegistry.clear();
  });

  it("returns null when activeChainId is null", () => {
    const { result } = renderHook(() => useEscrowAdapter());
    expect(result.current).toBeNull();
  });

  it("returns adapter from registry when chain is selected", () => {
    const adapter = makeAdapter("solana-local");
    adapterRegistry.register("solana-local", adapter);
    useWalletStore.setState({ activeChainId: "solana-local" });

    const { result } = renderHook(() => useEscrowAdapter());
    expect(result.current).toBe(adapter);
  });

  it("returns null when chain is selected but no adapter registered", () => {
    useWalletStore.setState({ activeChainId: "stellar-testnet" });
    const { result } = renderHook(() => useEscrowAdapter());
    expect(result.current).toBeNull();
  });

  it("re-renders when activeChainId changes", () => {
    const adapter1 = makeAdapter("solana-local");
    const adapter2 = makeAdapter("stellar-testnet");
    adapterRegistry.register("solana-local", adapter1);
    adapterRegistry.register("stellar-testnet", adapter2);

    useWalletStore.setState({ activeChainId: "solana-local" });
    const { result, rerender } = renderHook(() => useEscrowAdapter());

    expect(result.current).toBe(adapter1);

    act(() => {
      useWalletStore.setState({ activeChainId: "stellar-testnet" });
    });
    rerender();

    expect(result.current).toBe(adapter2);
  });

  it("does not call adapter methods — only returns reference", () => {
    const adapter = makeAdapter("solana-devnet");
    const createSpy = vi.spyOn(adapter, "createEscrow");
    adapterRegistry.register("solana-devnet", adapter);
    useWalletStore.setState({ activeChainId: "solana-devnet" });

    const { result } = renderHook(() => useEscrowAdapter());
    expect(result.current).toBe(adapter);
    expect(createSpy).not.toHaveBeenCalled();
  });
});

describe("useEscrowAdapterSafe", () => {
  beforeEach(() => {
    useWalletStore.setState({
      activeChainId: null,
      session: null,
      status: "disconnected",
      error: null,
    });
    adapterRegistry.clear();
  });

  afterEach(() => {
    useWalletStore.setState({
      activeChainId: null,
      session: null,
      status: "disconnected",
      error: null,
    });
    adapterRegistry.clear();
  });

  it("returns adapter when found", () => {
    const adapter = makeAdapter("solana-local");
    adapterRegistry.register("solana-local", adapter);
    useWalletStore.setState({ activeChainId: "solana-local" });

    const { result } = renderHook(() => useEscrowAdapterSafe());
    expect(result.current).toBe(adapter);
  });

  it("throws EscrowAdapterError when activeChainId is null", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => { });
    expect(() => renderHook(() => useEscrowAdapterSafe())).toThrow(EscrowAdapterError);
    spy.mockRestore();
  });

  it("throws EscrowAdapterError when no adapter registered", () => {
    useWalletStore.setState({ activeChainId: "stellar-local" });
    const spy = vi.spyOn(console, "error").mockImplementation(() => { });
    expect(() => renderHook(() => useEscrowAdapterSafe())).toThrow(EscrowAdapterError);
    spy.mockRestore();
  });

  it("throws with not_connected code when no chain", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => { });
    try {
      renderHook(() => useEscrowAdapterSafe());
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(EscrowAdapterError);
      expect((e as EscrowAdapterError).code).toBe("not_connected");
    } finally {
      spy.mockRestore();
    }
  });
});
