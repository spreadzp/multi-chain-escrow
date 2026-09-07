import { describe, it, expect } from "vitest";
import type { EscrowAdapter } from "@/shared/types";
import { EscrowAdapterError, type EscrowAdapterErrorCode } from "./types";

describe("EscrowAdapter interface", () => {
  it("mock object satisfies EscrowAdapter with all 8 members", () => {
    const mock: EscrowAdapter = {
      chainId: "solana-devnet",
      createEscrow: async () => ({ escrowId: "esc-1", txHash: "tx-1" }),
      releaseEscrow: async () => ({ txHash: "tx-2" }),
      refundEscrow: async () => ({ txHash: "tx-3" }),
      getEscrow: async () => null,
      listEscrowsByUser: async () => [],
      subscribeEvents: () => () => { },
      setWalletAddress: () => { },
    };
    expect(mock.chainId).toBe("solana-devnet");
    expect(typeof mock.createEscrow).toBe("function");
    expect(typeof mock.releaseEscrow).toBe("function");
    expect(typeof mock.refundEscrow).toBe("function");
    expect(typeof mock.getEscrow).toBe("function");
    expect(typeof mock.listEscrowsByUser).toBe("function");
    expect(typeof mock.subscribeEvents).toBe("function");
    expect(typeof mock.setWalletAddress).toBe("function");
  });

  it("subscribeEvents returns a cleanup function", () => {
    const mock: EscrowAdapter = {
      chainId: "stellar-testnet",
      createEscrow: async () => ({ escrowId: "e", txHash: "t" }),
      releaseEscrow: async () => ({ txHash: "t" }),
      refundEscrow: async () => ({ txHash: "t" }),
      getEscrow: async () => null,
      listEscrowsByUser: async () => [],
      subscribeEvents: (cb) => {
        cb({
          id: "evt-1",
          chainId: "stellar-testnet",
          type: "Deposited",
          escrowId: "esc-1",
          txHash: "tx-1",
          blockOrLedger: "1",
          timestamp: Date.now(),
          payload: {},
        });
        return () => { };
      },
      setWalletAddress: () => { },
    };
    const cleanup = mock.subscribeEvents(() => { });
    expect(typeof cleanup).toBe("function");
    cleanup();
  });
});

describe("EscrowAdapterError", () => {
  it("creates error with typed code", () => {
    const err = new EscrowAdapterError("not_connected", "Wallet not connected");
    expect(err.code).toBe("not_connected");
    expect(err.message).toBe("Wallet not connected");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(EscrowAdapterError);
  });

  it("supports all error codes", () => {
    const codes: EscrowAdapterErrorCode[] = [
      "not_connected",
      "insufficient_permissions",
      "escrow_not_found",
      "network_error",
      "unknown",
    ];
    for (const code of codes) {
      const err = new EscrowAdapterError(code, `test ${code}`);
      expect(err.code).toBe(code);
    }
  });

  it("defaults to unknown code", () => {
    const err = new EscrowAdapterError("unknown", "something broke");
    expect(err.code).toBe("unknown");
    expect(err.message).toBe("something broke");
  });
});
