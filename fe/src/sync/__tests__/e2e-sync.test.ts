// @vitest-environment node
import { describe, it, expect, afterEach } from "vitest";
import { MockEscrowAdapter } from "@/features/escrow/adapter/MockEscrowAdapter";
import { adapterRegistry } from "@/features/escrow/adapter/registry";
import { useEscrowStore, escrowKey } from "@/features/escrow/escrow-store";
import { useWalletStore } from "@/features/wallet/wallet-store";
import { SyncManager } from "../manager";
import {
  startSyncOnConnect,
  stopSync,
  handleChainSwitch,
} from "../lifecycle";
import type { ChainId, EscrowAdapter } from "@/shared/types";

const STELLAR_CHAIN: ChainId = "stellar-local";
const SOLANA_CHAIN: ChainId = "solana-local";
const ADDRESS = "GTESTADDR";

function setupChain(chainId: ChainId, adapter: EscrowAdapter) {
  adapterRegistry.clear();
  adapterRegistry.register(chainId, adapter);
  useWalletStore.setState({
    activeChainId: chainId,
    session: { address: ADDRESS, chainId, connectedAt: Date.now() },
    status: "connected",
    error: null,
  });
  useEscrowStore.setState({
    byId: {},
    events: [],
    loading: false,
    error: null,
  });
  (SyncManager as any).instance = null;
  SyncManager.getInstance({ pollIntervalMs: 500 }).stop();
}

function resetAll() {
  (SyncManager as any).instance = null;
  SyncManager.getInstance({ pollIntervalMs: 500 }).stop();
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe("E2E sync tests — both chains", () => {
  afterEach(() => {
    resetAll();
  });

  describe("Stellar chain", () => {
    it("create→sync→store update", async () => {
      const adapter = new MockEscrowAdapter(STELLAR_CHAIN);
      setupChain(STELLAR_CHAIN, adapter);

      const lifecycle = startSyncOnConnect(
        { address: ADDRESS, chainId: STELLAR_CHAIN, connectedAt: Date.now() },
        adapter,
      );

      await sleep(800);

      const result = await adapter.createEscrow({
        beneficiary: "GBENEF",
        resolver: "GRESOLV",
        amount: "1000",
        tokenAddress: "CDTOK",
      });

      await sleep(800);

      const state = useEscrowStore.getState();
      const escrows = Object.values(state.byId).filter(
        (e) => e.chainId === STELLAR_CHAIN,
      );
      expect(escrows.length).toBeGreaterThan(0);
      expect(escrows.some((e) => e.id === result.escrowId)).toBe(true);

      stopSync(lifecycle);
    }, 15000);

    it("event→store patch (Released)", async () => {
      const adapter = new MockEscrowAdapter(STELLAR_CHAIN);
      setupChain(STELLAR_CHAIN, adapter);
      adapter.setWalletAddress("GBENEF");

      const result = await adapter.createEscrow({
        beneficiary: "GBENEF",
        resolver: "GRESOLV",
        amount: "1000",
        tokenAddress: "CDTOK",
      });

      const lifecycle = startSyncOnConnect(
        { address: "GBENEF", chainId: STELLAR_CHAIN, connectedAt: Date.now() },
        adapter,
      );
      await sleep(800);

      const key = escrowKey(STELLAR_CHAIN, result.escrowId);
      expect(useEscrowStore.getState().byId[key]).toBeDefined();

      await adapter.releaseEscrow(result.escrowId);

      const stored = useEscrowStore.getState().byId[key];
      expect(stored.status).toBe("released");

      const events = useEscrowStore.getState().events;
      expect(events.some((e) => e.type === "Released" && e.escrowId === result.escrowId)).toBe(true);

      stopSync(lifecycle);
    }, 15000);
  });

  describe("Solana chain", () => {
    it("create→sync→store update", async () => {
      const adapter = new MockEscrowAdapter(SOLANA_CHAIN);
      setupChain(SOLANA_CHAIN, adapter);

      const lifecycle = startSyncOnConnect(
        { address: ADDRESS, chainId: SOLANA_CHAIN, connectedAt: Date.now() },
        adapter,
      );

      await sleep(800);

      const result = await adapter.createEscrow({
        beneficiary: "GBENEF",
        resolver: "GRESOLV",
        amount: "2000",
        tokenAddress: "SoToken",
      });

      await sleep(800);

      const state = useEscrowStore.getState();
      const escrows = Object.values(state.byId).filter(
        (e) => e.chainId === SOLANA_CHAIN,
      );
      expect(escrows.length).toBeGreaterThan(0);
      expect(escrows.some((e) => e.id === result.escrowId)).toBe(true);

      stopSync(lifecycle);
    }, 15000);

    it("event→store patch (Refunded)", async () => {
      const adapter = new MockEscrowAdapter(SOLANA_CHAIN);
      setupChain(SOLANA_CHAIN, adapter);
      adapter.setWalletAddress("GRESOLV");

      const result = await adapter.createEscrow({
        beneficiary: "GBENEF",
        resolver: "GRESOLV",
        amount: "2000",
        tokenAddress: "SoToken",
      });

      const lifecycle = startSyncOnConnect(
        { address: "GRESOLV", chainId: SOLANA_CHAIN, connectedAt: Date.now() },
        adapter,
      );
      await sleep(800);

      const key = escrowKey(SOLANA_CHAIN, result.escrowId);
      expect(useEscrowStore.getState().byId[key]).toBeDefined();

      await adapter.refundEscrow(result.escrowId);

      const stored = useEscrowStore.getState().byId[key];
      expect(stored.status).toBe("refunded");

      const events = useEscrowStore.getState().events;
      expect(events.some((e) => e.type === "Refunded" && e.escrowId === result.escrowId)).toBe(true);

      stopSync(lifecycle);
    }, 15000);
  });

  describe("Chain switch", () => {
    it("switches from Stellar to Solana and restarts sync", async () => {
      const stellarAdapter = new MockEscrowAdapter(STELLAR_CHAIN);
      const solanaAdapter = new MockEscrowAdapter(SOLANA_CHAIN);

      setupChain(STELLAR_CHAIN, stellarAdapter);
      const session1 = { address: ADDRESS, chainId: STELLAR_CHAIN, connectedAt: Date.now() };
      const lifecycle = startSyncOnConnect(session1, stellarAdapter);

      await sleep(800);

      await stellarAdapter.createEscrow({
        beneficiary: "GBENEF",
        amount: "1000",
        tokenAddress: "CDTOK",
      });
      await sleep(800);

      const stellarEscrows = Object.values(useEscrowStore.getState().byId).filter(
        (e) => e.chainId === STELLAR_CHAIN,
      );
      expect(stellarEscrows.length).toBeGreaterThan(0);

      adapterRegistry.register(SOLANA_CHAIN, solanaAdapter);
      useWalletStore.setState({ activeChainId: SOLANA_CHAIN });
      const session2 = { address: ADDRESS, chainId: SOLANA_CHAIN, connectedAt: Date.now() };
      const newLifecycle = handleChainSwitch(lifecycle, session2, solanaAdapter);

      await sleep(800);

      await solanaAdapter.createEscrow({
        beneficiary: "GBENEF",
        amount: "2000",
        tokenAddress: "SoToken",
      });
      await sleep(800);

      const solanaEscrows = Object.values(useEscrowStore.getState().byId).filter(
        (e) => e.chainId === SOLANA_CHAIN,
      );
      expect(solanaEscrows.length).toBeGreaterThan(0);

      expect(SyncManager.getInstance().isRunning()).toBe(true);

      stopSync(newLifecycle);
    }, 30000);
  });

  describe("Error scenarios", () => {
    it("network error → store.error set, UI survives", async () => {
      const adapter = new MockEscrowAdapter(STELLAR_CHAIN);
      setupChain(STELLAR_CHAIN, adapter);
      adapter.setWalletAddress(ADDRESS);

      (adapter as any).listEscrowsByUser = async () => {
        throw new Error("network error");
      };

      const lifecycle = startSyncOnConnect(
        { address: ADDRESS, chainId: STELLAR_CHAIN, connectedAt: Date.now() },
        adapter,
      );

      await sleep(4500);

      const state = useEscrowStore.getState();
      expect(state.error).not.toBeNull();
      expect(state.error).toContain("Сеть недоступна");

      useEscrowStore.getState().upsertEscrow({
        id: "test",
        chainId: STELLAR_CHAIN,
        depositor: "GDEP",
        beneficiary: "GBEN",
        resolver: "GRES",
        amount: "100",
        amountRaw: "100",
        tokenAddress: "CDTOK",
        status: "created",
        createdAt: 100,
        updatedAt: 100,
        txHashDeposit: "tx",
      });
      expect(useEscrowStore.getState().byId[escrowKey(STELLAR_CHAIN, "test")]).toBeDefined();

      stopSync(lifecycle);
    }, 15000);

    it("non-transient error → no retry, immediate store.error", async () => {
      const adapter = new MockEscrowAdapter(STELLAR_CHAIN);
      setupChain(STELLAR_CHAIN, adapter);
      adapter.setWalletAddress(ADDRESS);

      (adapter as any).listEscrowsByUser = async () => {
        throw new Error("Invalid argument");
      };

      const lifecycle = startSyncOnConnect(
        { address: ADDRESS, chainId: STELLAR_CHAIN, connectedAt: Date.now() },
        adapter,
      );

      await sleep(200);

      const state = useEscrowStore.getState();
      expect(state.error).toBe("Invalid argument");

      stopSync(lifecycle);
    }, 10000);
  });
});
