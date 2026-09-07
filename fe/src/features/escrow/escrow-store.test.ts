import { describe, it, expect, beforeEach } from "vitest";
import type { Escrow, EscrowEvent } from "@/shared/types";
import { useEscrowStore, escrowKey } from "./escrow-store";

function makeEscrow(overrides: Partial<Escrow> = {}): Escrow {
  return {
    id: "esc-1",
    chainId: "solana-devnet",
    depositor: "depositor-addr",
    beneficiary: "beneficiary-addr",
    resolver: "resolver-addr",
    amount: "100",
    amountRaw: "1000000000",
    tokenAddress: "token-addr",
    status: "created",
    createdAt: 0,
    updatedAt: 0,
    txHashDeposit: "tx-1",
    ...overrides,
  };
}

function makeEvent(overrides: Partial<EscrowEvent> = {}): EscrowEvent {
  return {
    id: "evt-1",
    chainId: "solana-devnet",
    type: "Deposited",
    escrowId: "esc-1",
    txHash: "tx-1",
    blockOrLedger: "1",
    timestamp: 1000,
    payload: {},
    ...overrides,
  };
}

describe("escrowKey", () => {
  it("produces chainId:id format", () => {
    expect(escrowKey("solana-devnet", "abc")).toBe("solana-devnet:abc");
    expect(escrowKey("stellar-testnet", "xyz")).toBe("stellar-testnet:xyz");
  });
});

describe("escrowStore initial state", () => {
  beforeEach(() => {
    useEscrowStore.getState().clear();
  });

  it("initializes with empty byId, empty events, loading false, error null", () => {
    const state = useEscrowStore.getState();
    expect(state.byId).toEqual({});
    expect(state.events).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});

describe("upsertEscrow", () => {
  beforeEach(() => {
    useEscrowStore.getState().clear();
  });

  it("adds new escrow to byId with correct key", () => {
    const escrow = makeEscrow();
    useEscrowStore.getState().upsertEscrow(escrow);
    const state = useEscrowStore.getState();
    expect(Object.keys(state.byId)).toHaveLength(1);
    expect(state.byId["solana-devnet:esc-1"]).toEqual(escrow);
  });

  it("updates existing escrow without duplicating", () => {
    const escrow = makeEscrow();
    useEscrowStore.getState().upsertEscrow(escrow);
    const updated = makeEscrow({ amount: "200", updatedAt: 100 });
    useEscrowStore.getState().upsertEscrow(updated);
    const state = useEscrowStore.getState();
    expect(Object.keys(state.byId)).toHaveLength(1);
    expect(state.byId["solana-devnet:esc-1"].amount).toBe("200");
    expect(state.byId["solana-devnet:esc-1"].updatedAt).toBe(100);
  });
});

describe("setEscrows", () => {
  beforeEach(() => {
    useEscrowStore.getState().clear();
  });

  it("replaces all entries", () => {
    useEscrowStore.getState().upsertEscrow(makeEscrow());
    const escrows = [
      makeEscrow({ id: "esc-a", chainId: "solana-devnet" }),
      makeEscrow({ id: "esc-b", chainId: "stellar-testnet" }),
    ];
    useEscrowStore.getState().setEscrows(escrows);
    const state = useEscrowStore.getState();
    expect(Object.keys(state.byId)).toHaveLength(2);
    expect(state.byId["solana-devnet:esc-a"]).toBeDefined();
    expect(state.byId["stellar-testnet:esc-b"]).toBeDefined();
  });
});

describe("patchStatus", () => {
  beforeEach(() => {
    useEscrowStore.getState().clear();
  });

  it("updates only the status field of an existing escrow", () => {
    const escrow = makeEscrow({ status: "created" });
    useEscrowStore.getState().upsertEscrow(escrow);
    useEscrowStore.getState().patchStatus("esc-1", "solana-devnet", "released");
    const state = useEscrowStore.getState();
    expect(state.byId["solana-devnet:esc-1"].status).toBe("released");
    expect(state.byId["solana-devnet:esc-1"].amount).toBe("100");
  });

  it("does nothing if escrow does not exist", () => {
    useEscrowStore.getState().patchStatus("nonexistent", "solana-devnet", "released");
    const state = useEscrowStore.getState();
    expect(Object.keys(state.byId)).toHaveLength(0);
  });
});

describe("addEvent", () => {
  beforeEach(() => {
    useEscrowStore.getState().clear();
  });

  it("appends to events array", () => {
    const evt1 = makeEvent({ id: "evt-1", timestamp: 1000 });
    const evt2 = makeEvent({ id: "evt-2", timestamp: 2000, type: "Released" });
    useEscrowStore.getState().addEvent(evt1);
    useEscrowStore.getState().addEvent(evt2);
    const state = useEscrowStore.getState();
    expect(state.events).toHaveLength(2);
    expect(state.events[0]).toEqual(evt1);
    expect(state.events[1]).toEqual(evt2);
  });
});

describe("setLoading / setError", () => {
  beforeEach(() => {
    useEscrowStore.getState().clear();
  });

  it("sets loading flag", () => {
    useEscrowStore.getState().setLoading(true);
    expect(useEscrowStore.getState().loading).toBe(true);
    useEscrowStore.getState().setLoading(false);
    expect(useEscrowStore.getState().loading).toBe(false);
  });

  it("sets error message", () => {
    useEscrowStore.getState().setError("something went wrong");
    expect(useEscrowStore.getState().error).toBe("something went wrong");
    useEscrowStore.getState().setError(null);
    expect(useEscrowStore.getState().error).toBeNull();
  });
});

describe("clear", () => {
  it("resets to initial state", () => {
    useEscrowStore.getState().upsertEscrow(makeEscrow());
    useEscrowStore.getState().addEvent(makeEvent());
    useEscrowStore.getState().setLoading(true);
    useEscrowStore.getState().setError("err");
    useEscrowStore.getState().clear();
    const state = useEscrowStore.getState();
    expect(state.byId).toEqual({});
    expect(state.events).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});
