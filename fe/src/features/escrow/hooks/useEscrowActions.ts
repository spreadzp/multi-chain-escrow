"use client";

import { useCallback } from "react";
import { useEscrowAdapterSafe } from "./useEscrowAdapter";
import { useEscrowStore } from "../escrow-store";
import { useWalletStore } from "@/features/wallet/wallet-store";
import type { CreateEscrowParams, Escrow, EscrowEvent } from "@/shared/types";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function makeEvent(
  chainId: Escrow["chainId"],
  type: EscrowEvent["type"],
  escrowId: string,
  txHash: string,
): EscrowEvent {
  return {
    id: crypto.randomUUID(),
    chainId,
    type,
    escrowId,
    txHash,
    blockOrLedger: "",
    timestamp: Date.now(),
    payload: {},
  };
}

export function useEscrowActions() {
  const adapter = useEscrowAdapterSafe();
  const address = useWalletStore((s) => s.session?.address);

  const createEscrow = useCallback(
    async (
      params: CreateEscrowParams,
    ): Promise<{ escrowId: string; txHash: string }> => {
      const store = useEscrowStore.getState();
      store.setLoading(true);
      store.setError(null);
      try {
        const result = await adapter.createEscrow(params);
        const now = Date.now();
        const escrow: Escrow = {
          id: result.escrowId,
          chainId: adapter.chainId,
          depositor: address ?? "",
          beneficiary: params.beneficiary,
          resolver: params.resolver ?? "",
          amount: params.amount,
          amountRaw: params.amount,
          tokenAddress: params.tokenAddress ?? "",
          status: "created",
          createdAt: now,
          updatedAt: now,
          txHashDeposit: result.txHash,
        };
        store.upsertEscrow(escrow);
        store.addEvent(
          makeEvent(
            adapter.chainId,
            "Deposited",
            result.escrowId,
            result.txHash,
          ),
        );
        return result;
      } catch (e) {
        store.setError(errorMessage(e));
        throw e;
      } finally {
        store.setLoading(false);
      }
    },
    [adapter, address],
  );

  const releaseEscrow = useCallback(
    async (escrowId: string): Promise<{ txHash: string }> => {
      const store = useEscrowStore.getState();
      store.setLoading(true);
      store.setError(null);
      try {
        const result = await adapter.releaseEscrow(escrowId);
        store.patchStatus(escrowId, adapter.chainId, "released");
        store.addEvent(
          makeEvent(adapter.chainId, "Released", escrowId, result.txHash),
        );
        return result;
      } catch (e) {
        store.setError(errorMessage(e));
        throw e;
      } finally {
        store.setLoading(false);
      }
    },
    [adapter],
  );

  const refundEscrow = useCallback(
    async (escrowId: string): Promise<{ txHash: string }> => {
      const store = useEscrowStore.getState();
      store.setLoading(true);
      store.setError(null);
      try {
        const result = await adapter.refundEscrow(escrowId);
        store.patchStatus(escrowId, adapter.chainId, "refunded");
        store.addEvent(
          makeEvent(adapter.chainId, "Refunded", escrowId, result.txHash),
        );
        return result;
      } catch (e) {
        store.setError(errorMessage(e));
        throw e;
      } finally {
        store.setLoading(false);
      }
    },
    [adapter],
  );

  const refreshEscrows = useCallback(async (): Promise<void> => {
    const store = useEscrowStore.getState();
    store.setLoading(true);
    store.setError(null);
    try {
      const escrows = await adapter.listEscrowsByUser(address ?? "");
      store.setEscrows(escrows);
    } catch (e) {
      store.setError(errorMessage(e));
      throw e;
    } finally {
      store.setLoading(false);
    }
  }, [adapter, address]);

  const clearError = useCallback(() => {
    useEscrowStore.getState().setError(null);
  }, []);

  return {
    createEscrow,
    releaseEscrow,
    refundEscrow,
    refreshEscrows,
    clearError,
  };
}
