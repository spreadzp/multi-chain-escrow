// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SyncManager } from "../manager";
import type { EscrowAdapter, Escrow, ChainId } from "@/shared/types";

// Mock the store
const mockSetEscrows = vi.fn();
const mockSetLoading = vi.fn();
const mockSetError = vi.fn();
vi.mock("@/features/escrow/escrow-store", () => ({
  useEscrowStore: {
    getState: () => ({
      setEscrows: mockSetEscrows,
      setLoading: mockSetLoading,
      setError: mockSetError,
      byId: {},
    }),
    setState: vi.fn(),
  },
  escrowKey: (chainId: string, id: string) => `${chainId}:${id}`,
}));

function makeAdapter(chainId: ChainId, escrows: Escrow[]): EscrowAdapter {
  return {
    chainId,
    setWalletAddress: vi.fn(),
    createEscrow: vi.fn(),
    releaseEscrow: vi.fn(),
    refundEscrow: vi.fn(),
    getEscrow: vi.fn(),
    listEscrowsByUser: vi.fn().mockResolvedValue(escrows),
    subscribeEvents: vi.fn(() => () => { }),
  };
}

const testEscrows: Escrow[] = [
  {
    id: "0",
    chainId: "stellar-local",
    depositor: "GDEP",
    beneficiary: "GBEN",
    resolver: "GRES",
    amount: "1000",
    amountRaw: "1000",
    tokenAddress: "CDTOK",
    status: "created",
    createdAt: 123,
    updatedAt: 123,
    txHashDeposit: "abc",
  },
];

describe("SyncManager", () => {
  let originalSetInterval: typeof setInterval;
  let originalClearInterval: typeof clearInterval;

  beforeEach(() => {
    originalSetInterval = global.setInterval;
    originalClearInterval = global.clearInterval;
    vi.useFakeTimers();
    // Reset singleton between tests
    (SyncManager as any).instance = null;
  });

  afterEach(() => {
    vi.useRealTimers();
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  });

  it("is a singleton", () => {
    const a = SyncManager.getInstance();
    const b = SyncManager.getInstance();
    expect(a).toBe(b);
  });

  it("start sets up polling and calls listEscrowsByUser immediately", async () => {
    const adapter = makeAdapter("stellar-local", testEscrows);
    const manager = SyncManager.getInstance({ pollIntervalMs: 1000 });
    const onPoll = vi.fn();

    manager.start(adapter, "GDEP", onPoll);

    // First poll is immediate — flush microtasks
    await vi.advanceTimersByTimeAsync(0);

    expect(adapter.listEscrowsByUser).toHaveBeenCalledWith("GDEP");
    expect(onPoll).toHaveBeenCalledWith(testEscrows);
    expect(manager.isRunning()).toBe(true);

    manager.stop();
  });

  it("poll calls listEscrowsByUser at interval", async () => {
    const adapter = makeAdapter("stellar-local", testEscrows);
    const manager = SyncManager.getInstance({ pollIntervalMs: 1000 });

    manager.start(adapter, "GDEP");

    // First poll (immediate)
    await vi.advanceTimersByTimeAsync(0);
    expect(adapter.listEscrowsByUser).toHaveBeenCalledTimes(1);

    // Second poll (after 1s)
    await vi.advanceTimersByTimeAsync(1000);
    expect(adapter.listEscrowsByUser).toHaveBeenCalledTimes(2);

    // Third poll
    await vi.advanceTimersByTimeAsync(1000);
    expect(adapter.listEscrowsByUser).toHaveBeenCalledTimes(3);

    manager.stop();
  });

  it("stop clears interval and stops polling", async () => {
    const adapter = makeAdapter("stellar-local", testEscrows);
    const manager = SyncManager.getInstance({ pollIntervalMs: 1000 });

    manager.start(adapter, "GDEP");
    await vi.advanceTimersByTimeAsync(0);
    expect(manager.isRunning()).toBe(true);

    manager.stop();
    expect(manager.isRunning()).toBe(false);

    const callCount = (adapter.listEscrowsByUser as any).mock.calls.length;
    await vi.advanceTimersByTimeAsync(3000);
    expect((adapter.listEscrowsByUser as any).mock.calls.length).toBe(callCount);
  });

  it("getState returns current sync state", async () => {
    const adapter = makeAdapter("stellar-local", testEscrows);
    const manager = SyncManager.getInstance({ pollIntervalMs: 1000 });

    expect(manager.getState()).toBeNull();

    manager.start(adapter, "GDEP");
    await vi.advanceTimersByTimeAsync(0);

    const state = manager.getState();
    expect(state).not.toBeNull();
    expect(state!.chainId).toBe("stellar-local");
    expect(state!.address).toBe("GDEP");
    expect(state!.status).toBe("polling");
    expect(state!.lastPollAt).not.toBeNull();

    manager.stop();
  });

  it("handles poll errors gracefully", async () => {
    const adapter = makeAdapter("stellar-local", []);
    (adapter.listEscrowsByUser as any).mockRejectedValue(new Error("network error"));
    const manager = SyncManager.getInstance({ pollIntervalMs: 1000 });

    manager.start(adapter, "GDEP");
    // Advance past all retry backoff delays (500 + 1000 + 2000 = 3500ms)
    await vi.advanceTimersByTimeAsync(4000);

    const state = manager.getState();
    expect(state).not.toBeNull();
    expect(state!.status).toBe("error");
    expect(state!.error).toContain("Сеть недоступна");

    manager.stop();
  });

  it("start replaces previous sync session", async () => {
    const adapter1 = makeAdapter("stellar-local", testEscrows);
    const adapter2 = makeAdapter("solana-local", []);
    const manager = SyncManager.getInstance({ pollIntervalMs: 1000 });

    manager.start(adapter1, "GADDR1");
    await vi.advanceTimersByTimeAsync(0);
    expect(adapter1.listEscrowsByUser).toHaveBeenCalledTimes(1);

    manager.start(adapter2, "GADDR2");
    await vi.advanceTimersByTimeAsync(0);
    expect(adapter2.listEscrowsByUser).toHaveBeenCalledWith("GADDR2");

    const state = manager.getState();
    expect(state!.chainId).toBe("solana-local");
    expect(state!.address).toBe("GADDR2");

    manager.stop();
  });
});
