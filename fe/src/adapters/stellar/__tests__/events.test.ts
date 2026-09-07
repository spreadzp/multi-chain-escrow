// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseEventFromResponse,
  subscribeToEscrowEvents,
  type EventsContext,
} from "../events";
import type { EscrowEvent } from "@/shared/types";

// Mock the Stellar SDK
vi.mock("@stellar/stellar-sdk", () => {
  return {
    scValToNative: (val: any) => {
      if (val && val.__native !== undefined) return val.__native;
      return val;
    },
    xdr: {
      ScVal: {},
    },
    rpc: {
      Server: function () {},
      Api: {
        GetTransactionResponse: {},
        isSimulationError: (sim: { error?: string }) => !!sim.error,
      },
    },
  };
});

function makeEventResponse(
  topicNative: unknown[],
  valueNative: unknown,
  extra: Record<string, unknown> = {},
): any {
  return {
    id: "evt-1",
    type: "contract",
    ledger: 100,
    ledgerClosedAt: "2026-09-04T12:00:00Z",
    transactionIndex: 0,
    operationIndex: 0,
    inSuccessfulContractCall: true,
    txHash: "abc123",
    topic: topicNative.map((n) => ({ __native: n })),
    value: { __native: valueNative },
    ...extra,
  };
}

describe("parseEventFromResponse", () => {
  it("parses Deposited event", () => {
    const event = makeEventResponse(
      ["Deposited", BigInt(0)],
      ["GDEPOSITOR", "GBENEF", BigInt(1000000)],
    );
    const result = parseEventFromResponse(event, "stellar-local");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("Deposited");
    expect(result!.escrowId).toBe("0");
    expect(result!.txHash).toBe("abc123");
    expect(result!.blockOrLedger).toBe("100");
    expect(result!.payload.depositor).toBe("GDEPOSITOR");
    expect(result!.payload.beneficiary).toBe("GBENEF");
    expect(result!.payload.amount).toBe("1000000");
  });

  it("parses Released event", () => {
    const event = makeEventResponse(
      ["Released", BigInt(1)],
      ["GBENEF", BigInt(500000)],
    );
    const result = parseEventFromResponse(event, "stellar-local");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("Released");
    expect(result!.escrowId).toBe("1");
    expect(result!.payload.beneficiary).toBe("GBENEF");
    expect(result!.payload.amount).toBe("500000");
  });

  it("parses Refunded event", () => {
    const event = makeEventResponse(
      ["Refunded", BigInt(2)],
      ["GDEPOSITOR", BigInt(500000)],
    );
    const result = parseEventFromResponse(event, "stellar-local");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("Refunded");
    expect(result!.escrowId).toBe("2");
    expect(result!.payload.depositor).toBe("GDEPOSITOR");
    expect(result!.payload.amount).toBe("500000");
  });

  it("returns null for unknown event type", () => {
    const event = makeEventResponse(
      ["Unknown", BigInt(0)],
      ["GDEPOSITOR", BigInt(100)],
    );
    const result = parseEventFromResponse(event, "stellar-local");
    expect(result).toBeNull();
  });

  it("includes chainId in result", () => {
    const event = makeEventResponse(
      ["Deposited", BigInt(0)],
      ["GDEPOSITOR", "GBENEF", BigInt(100)],
    );
    const result = parseEventFromResponse(event, "stellar-local");
    expect(result!.chainId).toBe("stellar-local");
  });
});

describe("subscribeToEscrowEvents", () => {
  let originalSetInterval: typeof setInterval;
  let originalClearInterval: typeof clearInterval;

  beforeEach(() => {
    originalSetInterval = global.setInterval;
    originalClearInterval = global.clearInterval;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  });

  it("returns a cleanup function", () => {
    const mockServer: any = {
      getLatestLedger: vi.fn().mockResolvedValue({ sequence: 100 }),
      getEvents: vi.fn().mockResolvedValue({ events: [], cursor: "" }),
    };
    const ctx: EventsContext = {
      server: mockServer,
      contractId: "CDTEST",
      chainId: "stellar-local",
    };
    const cleanup = subscribeToEscrowEvents(ctx, () => {});
    expect(typeof cleanup).toBe("function");
    cleanup();
  });

  it("calls onEvent when events are found", async () => {
    const mockServer: any = {
      getLatestLedger: vi.fn()
        .mockResolvedValueOnce({ sequence: 100 })
        .mockResolvedValueOnce({ sequence: 102 }),
      getEvents: vi.fn().mockResolvedValue({
        events: [
          makeEventResponse(
            ["Deposited", BigInt(0)],
            ["GDEPOSITOR", "GBENEF", BigInt(1000)],
          ),
        ],
        cursor: "",
      }),
    };
    const ctx: EventsContext = {
      server: mockServer,
      contractId: "CDTEST",
      chainId: "stellar-local",
    };

    const received: EscrowEvent[] = [];
    const cleanup = subscribeToEscrowEvents(ctx, (e) => received.push(e));

    // First tick: records ledger 100
    await vi.advanceTimersByTimeAsync(2000);
    // Second tick: ledger moved to 102, fetches events
    await vi.advanceTimersByTimeAsync(2000);

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe("Deposited");

    cleanup();
  });

  it("stops polling after cleanup", async () => {
    const mockServer: any = {
      getLatestLedger: vi.fn().mockResolvedValue({ sequence: 100 }),
      getEvents: vi.fn().mockResolvedValue({ events: [], cursor: "" }),
    };
    const ctx: EventsContext = {
      server: mockServer,
      contractId: "CDTEST",
      chainId: "stellar-local",
    };

    const cleanup = subscribeToEscrowEvents(ctx, () => {});
    cleanup();

    await vi.advanceTimersByTimeAsync(6000);
    expect(mockServer.getLatestLedger).not.toHaveBeenCalled();
  });

  it("silently handles polling errors", async () => {
    const mockServer: any = {
      getLatestLedger: vi.fn()
        .mockResolvedValueOnce({ sequence: 100 })
        .mockRejectedValueOnce(new Error("network error")),
      getEvents: vi.fn(),
    };
    const ctx: EventsContext = {
      server: mockServer,
      contractId: "CDTEST",
      chainId: "stellar-local",
    };

    const cleanup = subscribeToEscrowEvents(ctx, () => {});

    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(2000);

    // Should not throw — just silently retry
    expect(mockServer.getEvents).not.toHaveBeenCalled();

    cleanup();
  });
});
