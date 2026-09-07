import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWalletStore } from "@/features/wallet/wallet-store";
import { useEscrowStore, escrowKey } from "../escrow-store";
import { adapterRegistry } from "../adapter/registry";
import type {
  EscrowAdapter,
  Escrow,
  ChainId,
  CreateEscrowParams,
} from "@/shared/types";
import { useEscrowActions } from "./useEscrowActions";

const CHAIN_ID: ChainId = "solana-devnet";
const ADDRESS = "0xWallet123";

function makeMockAdapter(
  overrides?: Partial<EscrowAdapter>,
): EscrowAdapter {
  return {
    chainId: CHAIN_ID,
    createEscrow: vi
      .fn()
      .mockResolvedValue({ escrowId: "esc1", txHash: "tx_create" }),
    releaseEscrow: vi.fn().mockResolvedValue({ txHash: "tx_release" }),
    refundEscrow: vi.fn().mockResolvedValue({ txHash: "tx_refund" }),
    getEscrow: vi.fn().mockResolvedValue(null),
    listEscrowsByUser: vi.fn().mockResolvedValue([]),
    subscribeEvents: vi.fn().mockReturnValue(() => { }),
    setWalletAddress: vi.fn(),
    ...overrides,
  };
}

function makeEscrow(id: string, status: Escrow["status"] = "created"): Escrow {
  return {
    id,
    chainId: CHAIN_ID,
    depositor: ADDRESS,
    beneficiary: "0xBenef",
    resolver: "0xResolver",
    amount: "100",
    amountRaw: "100",
    tokenAddress: "0xToken",
    status,
    createdAt: 1000,
    updatedAt: 1000,
    txHashDeposit: "tx_create",
  };
}

function setup(adapter?: EscrowAdapter) {
  useWalletStore.setState({
    activeChainId: CHAIN_ID,
    session: { address: ADDRESS, chainId: CHAIN_ID, connectedAt: Date.now() },
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

describe("useEscrowActions", () => {
  let unmountFn: (() => void) | null = null;

  afterEach(() => {
    if (unmountFn) {
      unmountFn();
      unmountFn = null;
    }
    resetStores();
  });

  describe("createEscrow", () => {
    it("calls adapter.createEscrow and updates store on success", async () => {
      const adapter = makeMockAdapter();
      setup(adapter);
      const params: CreateEscrowParams = {
        beneficiary: "0xBenef",
        amount: "100",
        resolver: "0xResolver",
        tokenAddress: "0xToken",
      };
      const { result, unmount } = renderHook(() => useEscrowActions());
      unmountFn = unmount;

      await act(async () => {
        await result.current.createEscrow(params);
      });

      expect(adapter.createEscrow).toHaveBeenCalledWith(params);
      const state = useEscrowStore.getState();
      const key = escrowKey(CHAIN_ID, "esc1");
      expect(state.byId[key]).toBeDefined();
      expect(state.byId[key].id).toBe("esc1");
      expect(state.byId[key].chainId).toBe(CHAIN_ID);
      expect(state.byId[key].beneficiary).toBe("0xBenef");
      expect(state.byId[key].depositor).toBe(ADDRESS);
      expect(state.byId[key].status).toBe("created");
      expect(state.byId[key].txHashDeposit).toBe("tx_create");
      expect(state.events).toHaveLength(1);
      expect(state.events[0].type).toBe("Deposited");
      expect(state.events[0].escrowId).toBe("esc1");
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets error and re-throws on failure", async () => {
      const adapter = makeMockAdapter({
        createEscrow: vi.fn().mockRejectedValue(new Error("create failed")),
      });
      setup(adapter);
      const { result, unmount } = renderHook(() => useEscrowActions());
      unmountFn = unmount;

      await expect(
        act(async () => {
          await result.current.createEscrow({
            beneficiary: "0xBenef",
            amount: "100",
          });
        }),
      ).rejects.toThrow("create failed");

      const state = useEscrowStore.getState();
      expect(state.error).toBe("create failed");
      expect(state.loading).toBe(false);
    });

    it("sets loading true during call then false after", async () => {
      let resolveCreate: (value: {
        escrowId: string;
        txHash: string;
      }) => void = () => { };
      const adapter = makeMockAdapter({
        createEscrow: vi.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              resolveCreate = resolve;
            }),
        ),
      });
      setup(adapter);
      const { result, unmount } = renderHook(() => useEscrowActions());
      unmountFn = unmount;

      let promise: Promise<unknown>;
      act(() => {
        promise = result.current.createEscrow({
          beneficiary: "0xBenef",
          amount: "100",
        });
      });

      expect(useEscrowStore.getState().loading).toBe(true);
      expect(useEscrowStore.getState().error).toBeNull();

      await act(async () => {
        resolveCreate({ escrowId: "esc1", txHash: "tx1" });
        await promise;
      });

      expect(useEscrowStore.getState().loading).toBe(false);
    });
  });

  describe("releaseEscrow", () => {
    it("calls adapter.releaseEscrow, patches status to released, adds event", async () => {
      const adapter = makeMockAdapter();
      setup(adapter);
      useEscrowStore.getState().upsertEscrow(makeEscrow("esc1"));

      const { result, unmount } = renderHook(() => useEscrowActions());
      unmountFn = unmount;

      await act(async () => {
        await result.current.releaseEscrow("esc1");
      });

      expect(adapter.releaseEscrow).toHaveBeenCalledWith("esc1");
      const state = useEscrowStore.getState();
      expect(state.byId[escrowKey(CHAIN_ID, "esc1")].status).toBe("released");
      expect(state.events).toHaveLength(1);
      expect(state.events[0].type).toBe("Released");
      expect(state.events[0].escrowId).toBe("esc1");
      expect(state.events[0].txHash).toBe("tx_release");
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets error and re-throws on failure", async () => {
      const adapter = makeMockAdapter({
        releaseEscrow: vi.fn().mockRejectedValue(new Error("release failed")),
      });
      setup(adapter);
      const { result, unmount } = renderHook(() => useEscrowActions());
      unmountFn = unmount;

      await expect(
        act(async () => {
          await result.current.releaseEscrow("esc1");
        }),
      ).rejects.toThrow("release failed");

      expect(useEscrowStore.getState().error).toBe("release failed");
      expect(useEscrowStore.getState().loading).toBe(false);
    });
  });

  describe("refundEscrow", () => {
    it("calls adapter.refundEscrow, patches status to refunded, adds event", async () => {
      const adapter = makeMockAdapter();
      setup(adapter);
      useEscrowStore.getState().upsertEscrow(makeEscrow("esc1"));

      const { result, unmount } = renderHook(() => useEscrowActions());
      unmountFn = unmount;

      await act(async () => {
        await result.current.refundEscrow("esc1");
      });

      expect(adapter.refundEscrow).toHaveBeenCalledWith("esc1");
      const state = useEscrowStore.getState();
      expect(state.byId[escrowKey(CHAIN_ID, "esc1")].status).toBe("refunded");
      expect(state.events).toHaveLength(1);
      expect(state.events[0].type).toBe("Refunded");
      expect(state.events[0].escrowId).toBe("esc1");
      expect(state.events[0].txHash).toBe("tx_refund");
      expect(state.loading).toBe(false);
    });

    it("sets error and re-throws on failure", async () => {
      const adapter = makeMockAdapter({
        refundEscrow: vi.fn().mockRejectedValue(new Error("refund failed")),
      });
      setup(adapter);
      const { result, unmount } = renderHook(() => useEscrowActions());
      unmountFn = unmount;

      await expect(
        act(async () => {
          await result.current.refundEscrow("esc1");
        }),
      ).rejects.toThrow("refund failed");

      expect(useEscrowStore.getState().error).toBe("refund failed");
      expect(useEscrowStore.getState().loading).toBe(false);
    });
  });

  describe("refreshEscrows", () => {
    it("calls adapter.listEscrowsByUser with wallet address and sets escrows", async () => {
      const escrows = [makeEscrow("e1"), makeEscrow("e2", "released")];
      const adapter = makeMockAdapter({
        listEscrowsByUser: vi.fn().mockResolvedValue(escrows),
      });
      setup(adapter);
      const { result, unmount } = renderHook(() => useEscrowActions());
      unmountFn = unmount;

      await act(async () => {
        await result.current.refreshEscrows();
      });

      expect(adapter.listEscrowsByUser).toHaveBeenCalledWith(ADDRESS);
      const state = useEscrowStore.getState();
      expect(Object.keys(state.byId)).toHaveLength(2);
      expect(state.byId[escrowKey(CHAIN_ID, "e1")]).toBeDefined();
      expect(state.byId[escrowKey(CHAIN_ID, "e2")]).toBeDefined();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets error and re-throws on failure", async () => {
      const adapter = makeMockAdapter({
        listEscrowsByUser: vi
          .fn()
          .mockRejectedValue(new Error("refresh failed")),
      });
      setup(adapter);
      const { result, unmount } = renderHook(() => useEscrowActions());
      unmountFn = unmount;

      await expect(
        act(async () => {
          await result.current.refreshEscrows();
        }),
      ).rejects.toThrow("refresh failed");

      expect(useEscrowStore.getState().error).toBe("refresh failed");
      expect(useEscrowStore.getState().loading).toBe(false);
    });
  });

  describe("clearError", () => {
    it("resets error to null", () => {
      setup();
      useEscrowStore.getState().setError("some error");
      expect(useEscrowStore.getState().error).toBe("some error");

      const { result, unmount } = renderHook(() => useEscrowActions());
      unmountFn = unmount;

      act(() => {
        result.current.clearError();
      });

      expect(useEscrowStore.getState().error).toBeNull();
    });
  });
});
