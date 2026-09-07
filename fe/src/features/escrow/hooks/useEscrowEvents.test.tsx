import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWalletStore } from "@/features/wallet/wallet-store";
import { useEscrowStore, escrowKey } from "../escrow-store";
import { adapterRegistry } from "../adapter/registry";
import type { EscrowAdapter, EscrowEvent, Escrow, ChainId } from "@/shared/types";
import { useEscrowEvents } from "./useEscrowEvents";

const CHAIN_ID: ChainId = "solana-devnet";

function makeEvent(
  type: EscrowEvent["type"],
  escrowId: string,
  txHash: string,
): EscrowEvent {
  return {
    id: "evt-" + Math.random().toString(36).slice(2),
    chainId: CHAIN_ID,
    type,
    escrowId,
    txHash,
    blockOrLedger: "123",
    timestamp: Date.now(),
    payload: {},
  };
}

function makeEscrow(id: string): Escrow {
  return {
    id,
    chainId: CHAIN_ID,
    depositor: "0xDep",
    beneficiary: "0xBen",
    resolver: "0xRes",
    amount: "100",
    amountRaw: "100",
    tokenAddress: "0xToken",
    status: "created",
    createdAt: 1000,
    updatedAt: 1000,
    txHashDeposit: "tx_dep",
  };
}

function makeMockAdapter(
  subscribeEventsImpl?: EscrowAdapter["subscribeEvents"],
): EscrowAdapter {
  return {
    chainId: CHAIN_ID,
    createEscrow: vi.fn().mockResolvedValue({ escrowId: "e1", txHash: "tx1" }),
    releaseEscrow: vi.fn().mockResolvedValue({ txHash: "tx1" }),
    refundEscrow: vi.fn().mockResolvedValue({ txHash: "tx1" }),
    getEscrow: vi.fn().mockResolvedValue(null),
    listEscrowsByUser: vi.fn().mockResolvedValue([]),
    subscribeEvents: subscribeEventsImpl ?? vi.fn().mockReturnValue(() => {}),
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

describe("useEscrowEvents", () => {
  let unmountFn: (() => void) | null = null;

  afterEach(() => {
    if (unmountFn) {
      unmountFn();
      unmountFn = null;
    }
    resetStores();
  });

  it("subscribes to adapter.subscribeEvents on mount", () => {
    const subscribeEvents = vi.fn().mockReturnValue(() => {});
    const adapter = makeMockAdapter(subscribeEvents);
    setup(adapter);

    const { unmount } = renderHook(() => useEscrowEvents());
    unmountFn = unmount;

    expect(subscribeEvents).toHaveBeenCalledOnce();
    expect(subscribeEvents).toHaveBeenCalledWith(expect.any(Function));
  });

  it("returns subscribed: true when adapter is available", () => {
    setup();
    const { result, unmount } = renderHook(() => useEscrowEvents());
    unmountFn = unmount;

    expect(result.current.subscribed).toBe(true);
  });

  it("returns subscribed: false when adapter is null", () => {
    adapterRegistry.clear();
    useWalletStore.setState({
      activeChainId: null,
      session: null,
      status: "disconnected",
      error: null,
    });

    const { result, unmount } = renderHook(() => useEscrowEvents());
    unmountFn = unmount;

    expect(result.current.subscribed).toBe(false);
  });

  it("unsubscribes on unmount (cleanup function called)", () => {
    const cleanup = vi.fn();
    const subscribeEvents = vi.fn().mockReturnValue(cleanup);
    const adapter = makeMockAdapter(subscribeEvents);
    setup(adapter);

    const { unmount } = renderHook(() => useEscrowEvents());
    unmountFn = null; // we'll unmount manually

    unmount();

    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("Deposited event adds to store events without status patch", () => {
    let onEvent: ((e: EscrowEvent) => void) | null = null;
    const subscribeEvents = vi.fn().mockImplementation((cb: (e: EscrowEvent) => void) => {
      onEvent = cb;
      return () => {};
    });
    const adapter = makeMockAdapter(subscribeEvents);
    setup(adapter);
    useEscrowStore.getState().upsertEscrow(makeEscrow("esc1"));

    const { unmount } = renderHook(() => useEscrowEvents());
    unmountFn = unmount;

    const event = makeEvent("Deposited", "esc1", "tx_dep");
    act(() => {
      onEvent!(event);
    });

    const state = useEscrowStore.getState();
    expect(state.events).toHaveLength(1);
    expect(state.events[0]).toEqual(event);
    expect(state.byId[escrowKey(CHAIN_ID, "esc1")].status).toBe("created");
  });

  it("Released event adds to store events and patches status to released", () => {
    let onEvent: ((e: EscrowEvent) => void) | null = null;
    const subscribeEvents = vi.fn().mockImplementation((cb: (e: EscrowEvent) => void) => {
      onEvent = cb;
      return () => {};
    });
    const adapter = makeMockAdapter(subscribeEvents);
    setup(adapter);
    useEscrowStore.getState().upsertEscrow(makeEscrow("esc1"));

    const { unmount } = renderHook(() => useEscrowEvents());
    unmountFn = unmount;

    const event = makeEvent("Released", "esc1", "tx_rel");
    act(() => {
      onEvent!(event);
    });

    const state = useEscrowStore.getState();
    expect(state.events).toHaveLength(1);
    expect(state.events[0]).toEqual(event);
    expect(state.byId[escrowKey(CHAIN_ID, "esc1")].status).toBe("released");
  });

  it("Refunded event adds to store events and patches status to refunded", () => {
    let onEvent: ((e: EscrowEvent) => void) | null = null;
    const subscribeEvents = vi.fn().mockImplementation((cb: (e: EscrowEvent) => void) => {
      onEvent = cb;
      return () => {};
    });
    const adapter = makeMockAdapter(subscribeEvents);
    setup(adapter);
    useEscrowStore.getState().upsertEscrow(makeEscrow("esc1"));

    const { unmount } = renderHook(() => useEscrowEvents());
    unmountFn = unmount;

    const event = makeEvent("Refunded", "esc1", "tx_ref");
    act(() => {
      onEvent!(event);
    });

    const state = useEscrowStore.getState();
    expect(state.events).toHaveLength(1);
    expect(state.events[0]).toEqual(event);
    expect(state.byId[escrowKey(CHAIN_ID, "esc1")].status).toBe("refunded");
  });

  it("re-subscribes when adapter changes (chain switch)", () => {
    const cleanup1 = vi.fn();
    const subscribeEvents1 = vi.fn().mockReturnValue(cleanup1);
    const adapter1 = makeMockAdapter(subscribeEvents1);
    setup(adapter1);

    const { unmount, rerender } = renderHook(() => useEscrowEvents());
    unmountFn = unmount;

    expect(subscribeEvents1).toHaveBeenCalledOnce();

    // Switch chain — need a different chain adapter
    const CHAIN_ID_2: ChainId = "stellar-testnet";
    const subscribeEvents2 = vi.fn().mockReturnValue(() => {});
    const adapter2 = makeMockAdapter(subscribeEvents2);
    adapter2.chainId = CHAIN_ID_2;
    adapterRegistry.register(CHAIN_ID_2, adapter2);
    useWalletStore.setState({ activeChainId: CHAIN_ID_2 });

    rerender();

    expect(cleanup1).toHaveBeenCalledOnce();
    expect(subscribeEvents2).toHaveBeenCalledOnce();
  });

  it("does not subscribe when adapter is null on mount", () => {
    adapterRegistry.clear();
    useWalletStore.setState({
      activeChainId: null,
      session: null,
      status: "disconnected",
      error: null,
    });

    const { result, unmount } = renderHook(() => useEscrowEvents());
    unmountFn = unmount;

    expect(result.current.subscribed).toBe(false);
  });
});
