// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  startSyncOnConnect,
  stopSync,
  handleChainSwitch,
  handleReload,
  getAdapterForChain,
} from "../lifecycle";
import { getSyncManager } from "../manager";
import { useEscrowStore } from "@/features/escrow/escrow-store";
import type { EscrowAdapter, EscrowEvent, ChainId, WalletSession } from "@/shared/types";

// Mock store
vi.mock("@/features/escrow/escrow-store", () => ({
  useEscrowStore: {
    getState: () => ({
      setEscrows: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      byId: {},
    }),
  },
  escrowKey: (chainId: string, id: string) => `${chainId}:${id}`,
}));

// Mock registry
vi.mock("@/features/escrow/adapter/registry", () => ({
  adapterRegistry: {
    getAdapter: vi.fn(),
  },
}));

import { adapterRegistry } from "@/features/escrow/adapter/registry";

function makeAdapter(chainId: ChainId): EscrowAdapter {
  return {
    chainId,
    setWalletAddress: vi.fn(),
    createEscrow: vi.fn(),
    releaseEscrow: vi.fn(),
    refundEscrow: vi.fn(),
    getEscrow: vi.fn(),
    listEscrowsByUser: vi.fn().mockResolvedValue([]),
    subscribeEvents: vi.fn(() => () => {}),
  };
}

function makeSession(chainId: ChainId, address: string): WalletSession {
  return {
    address,
    chainId,
    connectedAt: Date.now(),
  };
}

describe("sync lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    (getSyncManager() as any).stop();
  });

  describe("startSyncOnConnect", () => {
    it("starts sync manager and event subscription", () => {
      const adapter = makeAdapter("stellar-local");
      const session = makeSession("stellar-local", "GADDR");

      const lifecycle = startSyncOnConnect(session, adapter);

      expect(adapter.setWalletAddress).toHaveBeenCalledWith("GADDR");
      expect(adapter.subscribeEvents).toHaveBeenCalled();
      expect(getSyncManager().isRunning()).toBe(true);

      lifecycle.stop();
    });

    it("returns lifecycle with stop function", () => {
      const adapter = makeAdapter("stellar-local");
      const session = makeSession("stellar-local", "GADDR");

      const lifecycle = startSyncOnConnect(session, adapter);

      expect(typeof lifecycle.stop).toBe("function");

      lifecycle.stop();
    });
  });

  describe("stopSync", () => {
    it("stops sync and event subscription", () => {
      const adapter = makeAdapter("stellar-local");
      const session = makeSession("stellar-local", "GADDR");

      const lifecycle = startSyncOnConnect(session, adapter);
      expect(getSyncManager().isRunning()).toBe(true);

      stopSync(lifecycle);
      expect(getSyncManager().isRunning()).toBe(false);
    });

    it("handles null lifecycle gracefully", () => {
      expect(() => stopSync(null)).not.toThrow();
    });
  });

  describe("handleChainSwitch", () => {
    it("stops current sync and starts with new adapter", () => {
      const adapter1 = makeAdapter("stellar-local");
      const adapter2 = makeAdapter("solana-local");
      const session1 = makeSession("stellar-local", "GADDR1");
      const session2 = makeSession("solana-local", "GADDR2");

      const lifecycle1 = startSyncOnConnect(session1, adapter1);
      expect(adapter1.setWalletAddress).toHaveBeenCalledWith("GADDR1");

      const lifecycle2 = handleChainSwitch(lifecycle1, session2, adapter2);

      expect(getSyncManager().isRunning()).toBe(true);
      expect(adapter2.setWalletAddress).toHaveBeenCalledWith("GADDR2");

      lifecycle2.stop();
    });
  });

  describe("handleReload", () => {
    it("returns null when no session", () => {
      const result = handleReload(null);
      expect(result).toBeNull();
    });

    it("returns null when adapter not found", () => {
      (adapterRegistry.getAdapter as any).mockReturnValue(null);
      const session = makeSession("stellar-local", "GADDR");
      const result = handleReload(session);
      expect(result).toBeNull();
    });

    it("starts sync when session and adapter available", () => {
      const adapter = makeAdapter("stellar-local");
      (adapterRegistry.getAdapter as any).mockReturnValue(adapter);
      const session = makeSession("stellar-local", "GADDR");

      const lifecycle = handleReload(session);

      expect(lifecycle).not.toBeNull();
      expect(getSyncManager().isRunning()).toBe(true);
      expect(adapter.setWalletAddress).toHaveBeenCalledWith("GADDR");

      lifecycle!.stop();
    });
  });

  describe("getAdapterForChain", () => {
    it("returns adapter from registry", () => {
      const adapter = makeAdapter("stellar-local");
      (adapterRegistry.getAdapter as any).mockReturnValue(adapter);

      const result = getAdapterForChain("stellar-local");
      expect(result).toBe(adapter);
    });

    it("returns null when adapter not found", () => {
      (adapterRegistry.getAdapter as any).mockReturnValue(null);
      const result = getAdapterForChain("stellar-testnet");
      expect(result).toBeNull();
    });
  });
});
