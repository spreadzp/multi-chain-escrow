import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSyncStatus, useEscrowsForActiveChain } from "../ui-bindings";
import { useEscrowStore } from "@/features/escrow/escrow-store";
import { useWalletStore } from "@/features/wallet/wallet-store";
import type { Escrow, ChainId } from "@/shared/types";

const CHAIN_ID: ChainId = "stellar-local";

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
    createdAt: 100,
    updatedAt: 100,
    txHashDeposit: "abc",
  };
}

describe("useSyncStatus", () => {
  beforeEach(() => {
    useEscrowStore.getState().clear();
  });

  it("returns initial loading=false and error=null", () => {
    const { result } = renderHook(() => useSyncStatus());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("reflects loading state from store", () => {
    const { result } = renderHook(() => useSyncStatus());
    act(() => {
      useEscrowStore.getState().setLoading(true);
    });
    expect(result.current.loading).toBe(true);
  });

  it("reflects error state from store", () => {
    const { result } = renderHook(() => useSyncStatus());
    act(() => {
      useEscrowStore.getState().setError("network error");
    });
    expect(result.current.error).toBe("network error");
  });
});

describe("useEscrowsForActiveChain", () => {
  beforeEach(() => {
    useEscrowStore.getState().clear();
    useWalletStore.getState().disconnect();
  });

  afterEach(() => {
    useEscrowStore.getState().clear();
    useWalletStore.getState().disconnect();
  });

  it("returns empty array when no escrows in store", () => {
    useWalletStore.getState().setChain(CHAIN_ID);
    const { result } = renderHook(() => useEscrowsForActiveChain());
    expect(result.current).toEqual([]);
  });

  it("returns escrows filtered by active chain", () => {
    const escrow1 = makeEscrow("0", "stellar-local");
    const escrow2 = makeEscrow("1", "solana-local");

    act(() => {
      useEscrowStore.getState().upsertEscrow(escrow1);
      useEscrowStore.getState().upsertEscrow(escrow2);
      useWalletStore.getState().setChain("stellar-local");
    });

    const { result } = renderHook(() => useEscrowsForActiveChain());
    expect(result.current).toHaveLength(1);
    expect(result.current[0].chainId).toBe("stellar-local");
  });

  it("updates when store changes", () => {
    useWalletStore.getState().setChain(CHAIN_ID);
    const { result } = renderHook(() => useEscrowsForActiveChain());
    expect(result.current).toEqual([]);

    act(() => {
      useEscrowStore.getState().upsertEscrow(makeEscrow("0"));
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe("0");
  });

  it("sorts by createdAt descending", () => {
    const older = makeEscrow("0");
    older.createdAt = 100;
    const newer = makeEscrow("1");
    newer.createdAt = 200;

    act(() => {
      useEscrowStore.getState().upsertEscrow(older);
      useEscrowStore.getState().upsertEscrow(newer);
      useWalletStore.getState().setChain(CHAIN_ID);
    });

    const { result } = renderHook(() => useEscrowsForActiveChain());
    expect(result.current[0].id).toBe("1");
    expect(result.current[1].id).toBe("0");
  });
});
