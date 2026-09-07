// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { startEventSubscription } from "../events";
import { useEscrowStore } from "@/features/escrow/escrow-store";
import type { EscrowAdapter, EscrowEvent, ChainId } from "@/shared/types";

const CHAIN_ID: ChainId = "stellar-local";

function makeAdapter(events: EscrowEvent[]): EscrowAdapter {
  let callback: ((e: EscrowEvent) => void) | null = null;
  return {
    chainId: CHAIN_ID,
    setWalletAddress: vi.fn(),
    createEscrow: vi.fn(),
    releaseEscrow: vi.fn(),
    refundEscrow: vi.fn(),
    getEscrow: vi.fn(),
    listEscrowsByUser: vi.fn(),
    subscribeEvents: vi.fn((cb: (e: EscrowEvent) => void) => {
      callback = cb;
      return () => {
        callback = null;
      };
    }),
  } as unknown as EscrowAdapter;
}

function makeEvent(
  type: EscrowEvent["type"],
  escrowId: string,
): EscrowEvent {
  return {
    id: `evt-${escrowId}-${type}`,
    chainId: CHAIN_ID,
    type,
    escrowId,
    txHash: "tx123",
    blockOrLedger: "100",
    timestamp: 456,
    payload: {},
  };
}

describe("startEventSubscription", () => {
  beforeEach(() => {
    useEscrowStore.getState().clear();
  });

  it("returns a cleanup function", () => {
    const adapter = makeAdapter([]);
    const cleanup = startEventSubscription({ adapter });
    expect(typeof cleanup).toBe("function");
    cleanup();
  });

  it("applies events to store when callback fires", () => {
    const adapter = makeAdapter([]);
    const cleanup = startEventSubscription({ adapter });

    // Simulate event from adapter
    const event = makeEvent("Deposited", "0");
    const subscribeMock = adapter.subscribeEvents as unknown as ReturnType<typeof vi.fn>;
    const callback = subscribeMock.mock.calls[0][0] as (e: EscrowEvent) => void;
    callback(event);

    expect(useEscrowStore.getState().events).toHaveLength(1);
    expect(useEscrowStore.getState().events[0]).toEqual(event);

    cleanup();
  });

  it("does not apply events for unknown escrows (non-Deposited)", () => {
    const adapter = makeAdapter([]);
    const cleanup = startEventSubscription({ adapter });

    const subscribeMock = adapter.subscribeEvents as unknown as ReturnType<typeof vi.fn>;
    const callback = subscribeMock.mock.calls[0][0] as (e: EscrowEvent) => void;

    // Released event for escrow not in store — should be filtered
    callback(makeEvent("Released", "999"));

    expect(useEscrowStore.getState().events).toHaveLength(0);

    cleanup();
  });

  it("applies Deposited events even for unknown escrows", () => {
    const adapter = makeAdapter([]);
    const cleanup = startEventSubscription({ adapter });

    const subscribeMock = adapter.subscribeEvents as unknown as ReturnType<typeof vi.fn>;
    const callback = subscribeMock.mock.calls[0][0] as (e: EscrowEvent) => void;

    callback(makeEvent("Deposited", "999"));

    expect(useEscrowStore.getState().events).toHaveLength(1);

    cleanup();
  });
});
