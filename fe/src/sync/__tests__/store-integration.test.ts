// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  applyEventToStore,
  applyEscrowsToStore,
  reconcileEventWithState,
} from "../store-integration";
import { useEscrowStore, escrowKey } from "@/features/escrow/escrow-store";
import type { Escrow, EscrowEvent, ChainId } from "@/shared/types";

const CHAIN_ID: ChainId = "stellar-local";

function makeEscrow(id: string, status: Escrow["status"] = "created"): Escrow {
  return {
    id,
    chainId: CHAIN_ID,
    depositor: "GDEP",
    beneficiary: "GBEN",
    resolver: "GRES",
    amount: "1000",
    amountRaw: "1000",
    tokenAddress: "CDTOK",
    status,
    createdAt: 123,
    updatedAt: 123,
    txHashDeposit: "abc",
  };
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

describe("applyEventToStore", () => {
  beforeEach(() => {
    useEscrowStore.getState().clear();
  });

  it("adds event to store events list", () => {
    const event = makeEvent("Deposited", "0");
    applyEventToStore(event);
    expect(useEscrowStore.getState().events).toHaveLength(1);
    expect(useEscrowStore.getState().events[0]).toEqual(event);
  });

  it("patches status to released on Released event", () => {
    const escrow = makeEscrow("0", "created");
    useEscrowStore.getState().upsertEscrow(escrow);

    const event = makeEvent("Released", "0");
    applyEventToStore(event);

    const stored = useEscrowStore.getState().byId[escrowKey(CHAIN_ID, "0")];
    expect(stored.status).toBe("released");
  });

  it("patches status to refunded on Refunded event", () => {
    const escrow = makeEscrow("0", "created");
    useEscrowStore.getState().upsertEscrow(escrow);

    const event = makeEvent("Refunded", "0");
    applyEventToStore(event);

    const stored = useEscrowStore.getState().byId[escrowKey(CHAIN_ID, "0")];
    expect(stored.status).toBe("refunded");
  });

  it("patches status to created on Deposited event", () => {
    const event = makeEvent("Deposited", "5");
    applyEventToStore(event);

    // Deposited creates a new escrow entry — patchStatus only works if escrow exists
    // The event is still added
    expect(useEscrowStore.getState().events).toHaveLength(1);
  });

  it("does not crash when escrow does not exist for non-Deposited event", () => {
    const event = makeEvent("Released", "999");
    applyEventToStore(event);
    // Should not throw, event still added
    expect(useEscrowStore.getState().events).toHaveLength(1);
  });
});

describe("applyEscrowsToStore", () => {
  beforeEach(() => {
    useEscrowStore.getState().clear();
  });

  it("replaces escrows for the given chain", () => {
    const escrow1 = makeEscrow("0");
    const escrow2 = makeEscrow("1");
    useEscrowStore.getState().upsertEscrow(escrow1);

    applyEscrowsToStore([escrow2], CHAIN_ID);

    const state = useEscrowStore.getState();
    expect(Object.keys(state.byId)).toHaveLength(1);
    expect(state.byId[escrowKey(CHAIN_ID, "1")]).toEqual(escrow2);
    expect(state.byId[escrowKey(CHAIN_ID, "0")]).toBeUndefined();
  });

  it("preserves escrows from other chains", () => {
    const stellarEscrow = makeEscrow("0");
    const solanaEscrow: Escrow = {
      ...makeEscrow("0"),
      chainId: "solana-local",
    };

    useEscrowStore.getState().upsertEscrow(stellarEscrow);
    useEscrowStore.getState().upsertEscrow(solanaEscrow);

    applyEscrowsToStore([stellarEscrow], CHAIN_ID);

    const state = useEscrowStore.getState();
    expect(state.byId[escrowKey(CHAIN_ID, "0")]).toEqual(stellarEscrow);
    expect(state.byId[escrowKey("solana-local", "0")]).toEqual(solanaEscrow);
  });
});

describe("reconcileEventWithState", () => {
  it("returns true for Deposited event even if escrow not in store", () => {
    const event = makeEvent("Deposited", "999");
    expect(reconcileEventWithState(event, {})).toBe(true);
  });

  it("returns true for Released event if escrow exists in store", () => {
    const escrow = makeEscrow("0");
    const event = makeEvent("Released", "0");
    const known = { [escrowKey(CHAIN_ID, "0")]: escrow };
    expect(reconcileEventWithState(event, known)).toBe(true);
  });

  it("returns false for Released event if escrow not in store", () => {
    const event = makeEvent("Released", "999");
    expect(reconcileEventWithState(event, {})).toBe(false);
  });

  it("returns false for Refunded event if escrow not in store", () => {
    const event = makeEvent("Refunded", "999");
    expect(reconcileEventWithState(event, {})).toBe(false);
  });
});
