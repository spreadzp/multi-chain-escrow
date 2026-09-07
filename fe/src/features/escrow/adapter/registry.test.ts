import { describe, it, expect, beforeEach } from "vitest";
import type { EscrowAdapter, ChainId } from "@/shared/types";
import { adapterRegistry, registerDefaults } from "./registry";

function makeAdapter(chainId: ChainId): EscrowAdapter {
  return {
    chainId,
    createEscrow: async () => ({ escrowId: "e1", txHash: "tx1" }),
    releaseEscrow: async () => ({ txHash: "tx1" }),
    refundEscrow: async () => ({ txHash: "tx1" }),
    getEscrow: async () => null,
    listEscrowsByUser: async () => [],
    subscribeEvents: () => () => {},
    setWalletAddress: () => {},
  };
}

describe("adapterRegistry", () => {
  beforeEach(() => {
    adapterRegistry.clear();
  });

  describe("register", () => {
    it("adds adapter to registry by chainId", () => {
      const adapter = makeAdapter("solana-local");
      adapterRegistry.register("solana-local", adapter);
      expect(adapterRegistry.getAdapter("solana-local")).toBe(adapter);
    });

    it("replaces existing adapter for same chainId", () => {
      const adapter1 = makeAdapter("solana-local");
      const adapter2 = makeAdapter("solana-local");
      adapterRegistry.register("solana-local", adapter1);
      adapterRegistry.register("solana-local", adapter2);
      expect(adapterRegistry.getAdapter("solana-local")).toBe(adapter2);
    });
  });

  describe("getAdapter", () => {
    it("returns adapter when registered", () => {
      const adapter = makeAdapter("stellar-testnet");
      adapterRegistry.register("stellar-testnet", adapter);
      expect(adapterRegistry.getAdapter("stellar-testnet")).toBe(adapter);
    });

    it("returns null when not registered", () => {
      expect(adapterRegistry.getAdapter("solana-devnet")).toBeNull();
    });
  });

  describe("hasAdapter", () => {
    it("returns true when adapter is registered", () => {
      adapterRegistry.register("solana-local", makeAdapter("solana-local"));
      expect(adapterRegistry.hasAdapter("solana-local")).toBe(true);
    });

    it("returns false when adapter is not registered", () => {
      expect(adapterRegistry.hasAdapter("stellar-local")).toBe(false);
    });
  });

  describe("clear", () => {
    it("empties the registry", () => {
      adapterRegistry.register("solana-local", makeAdapter("solana-local"));
      adapterRegistry.register("stellar-testnet", makeAdapter("stellar-testnet"));
      adapterRegistry.clear();
      expect(adapterRegistry.hasAdapter("solana-local")).toBe(false);
      expect(adapterRegistry.hasAdapter("stellar-testnet")).toBe(false);
    });
  });

  describe("singleton", () => {
    it("is the same instance across imports", async () => {
      const mod = await import("./registry");
      expect(mod.adapterRegistry).toBe(adapterRegistry);
    });
  });
});

describe("registerDefaults", () => {
  beforeEach(() => {
    adapterRegistry.clear();
  });

  it("registers stubs for all chains from config", () => {
    registerDefaults();
    expect(adapterRegistry.hasAdapter("solana-local")).toBe(true);
    expect(adapterRegistry.hasAdapter("solana-devnet")).toBe(true);
    expect(adapterRegistry.hasAdapter("stellar-local")).toBe(true);
    expect(adapterRegistry.hasAdapter("stellar-testnet")).toBe(true);
  });

  it("registered stubs have correct chainId", () => {
    registerDefaults();
    const adapter = adapterRegistry.getAdapter("solana-devnet");
    expect(adapter?.chainId).toBe("solana-devnet");
  });
});
