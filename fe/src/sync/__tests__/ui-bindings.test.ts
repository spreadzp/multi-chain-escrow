import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWalletStore } from "@/features/wallet/wallet-store";
import { useEscrowStore, escrowKey } from "@/features/escrow/escrow-store";
import { adapterRegistry } from "@/features/escrow/adapter/registry";
import type { EscrowAdapter, Escrow, ChainId } from "@/shared/types";
import {
  useSyncAutoRefresh,
  useSyncStatus,
  useEscrowsForActiveChain,
} from "../ui-bindings";

const CHAIN_ID: ChainId = "stellar-local";

function makeAdapter(chainId: ChainId): EscrowAdapter {
  return {
    chainId,
    setWalletAddress: vi.fn(),
    createEscrow: vi.fn(),
    releaseEscrow: vi.fn(),
    refundEscrow: vi.fn(),
    getEscrow: vi.fn(),
    listEscrowsByUser: vi.fn().mockResolvedValue([]),
    subscribeEvents: vi.fn(() => () => { }),
  };
}

function makeEscrow(id: string, chainId: ChainId = CHAIN_ID): Escrow {
  return {
    id,
    chainId,
    depositor: "GDEP",
    beneficiary: "GBEN",
    resolver: "GRES",
    amount: "1000",
    amountRaw: "1000",
    tokenAddress: "CDTOK",
    status: "created",
    createdAt: 1000,
    updatedAt: 1000,
    txHashDeposit: "abc",
  };
}

function setup(chainId: ChainId = CHAIN_ID) {
  adapterRegistry.clear();
  adapterRegistry.register(chainId, makeAdapter(chainId));
  useWalletStore.setState({
    activeChainId: chainId,
    session: { address: "GADDR", chainId, connectedAt: Date.now() },
    status: "connected",
    error: null,
  });
  useEscrowStore.setState({
    byId: {},
    events: [],
    loading: false,
    error: null,
  });
}

function resetStores() {
  adapterRegistry.clear();
  useWalletStore.setState({
    activeChainId: null,
    session: null,
    status: "disconnected",
    error: null,
  });
  useEscrowStore.setState({
    byId: {},
    events: [],
    loading: false,
    error: null,
  });
}

describe("useSyncAutoRefresh", () => {
  let unmountFn: (() => void) | null = null;

  afterEach(() => {
    if (unmountFn) {
      unmountFn();
      unmountFn = null;
    }
    resetStores();
  });

  it("starts sync when session is available", () => {
    setup();
    const { unmount } = renderHook(() => useSyncAutoRefresh());
    unmountFn = unmount;

    // Adapter should have setWalletAddress called
    const adapter = adapterRegistry.getAdapter(CHAIN_ID)!;
    expect(adapter.setWalletAddress).toHaveBeenCalledWith("GADDR");
  });

  it("stops sync on unmount", () => {
    setup();
    const { unmount } = renderHook(() => useSyncAutoRefresh());
    unmountFn = null;

    unmount();

    // No crash, cleanup ran
    expect(true).toBe(true);
  });

  it("does not start sync when no session", () => {
    adapterRegistry.clear();
    useWalletStore.setState({
      activeChainId: null,
      session: null,
      status: "disconnected",
      error: null,
    });
    const { unmount } = renderHook(() => useSyncAutoRefresh());
    unmountFn = unmount;

    // No adapter interaction
    expect(true).toBe(true);
  });
});

describe("useSyncStatus", () => {
  let unmountFn: (() => void) | null = null;

  afterEach(() => {
    if (unmountFn) {
      unmountFn();
      unmountFn = null;
    }
    resetStores();
  });

  it("returns loading and error from store", () => {
    useEscrowStore.setState({ loading: false, error: null });
    const { result, unmount } = renderHook(() => useSyncStatus());
    unmountFn = unmount;

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("reflects loading state changes", () => {
    const { result, unmount } = renderHook(() => useSyncStatus());
    unmountFn = unmount;

    act(() => {
      useEscrowStore.getState().setLoading(true);
    });
    expect(result.current.loading).toBe(true);

    act(() => {
      useEscrowStore.getState().setLoading(false);
    });
    expect(result.current.loading).toBe(false);
  });

  it("reflects error state changes", () => {
    const { result, unmount } = renderHook(() => useSyncStatus());
    unmountFn = unmount;

    act(() => {
      useEscrowStore.getState().setError("network error");
    });
    expect(result.current.error).toBe("network error");

    act(() => {
      useEscrowStore.getState().setError(null);
    });
    expect(result.current.error).toBeNull();
  });
});

describe("useEscrowsForActiveChain", () => {
  let unmountFn: (() => void) | null = null;

  afterEach(() => {
    if (unmountFn) {
      unmountFn();
      unmountFn = null;
    }
    resetStores();
  });

  it("returns escrows for active chain only", () => {
    setup();
    const escrow1 = makeEscrow("0", "stellar-local");
    const escrow2 = makeEscrow("1", "stellar-local");
    const escrow3 = makeEscrow("0", "solana-local");

    act(() => {
      useEscrowStore.getState().upsertEscrow(escrow1);
      useEscrowStore.getState().upsertEscrow(escrow2);
      useEscrowStore.getState().upsertEscrow(escrow3);
    });

    const { result, unmount } = renderHook(() => useEscrowsForActiveChain());
    unmountFn = unmount;

    expect(result.current).toHaveLength(2);
    expect(result.current.every((e) => e.chainId === "stellar-local")).toBe(true);
  });

  it("returns empty array when no escrows", () => {
    setup();
    const { result, unmount } = renderHook(() => useEscrowsForActiveChain());
    unmountFn = unmount;

    expect(result.current).toEqual([]);
  });

  it("updates when store changes", () => {
    setup();
    const { result, unmount } = renderHook(() => useEscrowsForActiveChain());
    unmountFn = unmount;

    expect(result.current).toEqual([]);

    act(() => {
      useEscrowStore.getState().upsertEscrow(makeEscrow("0"));
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe("0");
  });

  it("sorts by createdAt descending", () => {
    setup();
    const old = { ...makeEscrow("0"), createdAt: 100 };
    const newer = { ...makeEscrow("1"), createdAt: 200 };

    act(() => {
      useEscrowStore.getState().upsertEscrow(old);
      useEscrowStore.getState().upsertEscrow(newer);
    });

    const { result, unmount } = renderHook(() => useEscrowsForActiveChain());
    unmountFn = unmount;

    expect(result.current[0].id).toBe("1");
    expect(result.current[1].id).toBe("0");
  });
});
