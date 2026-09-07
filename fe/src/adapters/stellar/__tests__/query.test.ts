// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchEscrowAccount,
  listEscrowAccountsByUser,
  mapEscrowData,
  mapStatus,
  makeEscrowKey,
  makeCounterKey,
  type QueryContext,
  type RawEscrowData,
} from "../query";

// Mock the Stellar SDK
vi.mock("@stellar/stellar-sdk", () => {
  const mockScVal = {};
  return {
    xdr: {
      ScVal: {
        scvVec: (vals: unknown[]) => ({ type: "vec", vals }),
        scvSymbol: (s: string) => ({ type: "symbol", value: s }),
        scvU64: (v: unknown) => ({ type: "u64", value: v }),
        scvMap: (entries: unknown[]) => ({ type: "map", entries }),
      },
      Uint64: {
        fromString: (s: string) => ({ hi: 0, lo: Number(s) }),
      },
      ScMapEntry: function (this: any, opts: any) {
        Object.assign(this, opts);
      },
    },
    scValToNative: (scVal: any) => {
      if (scVal.type === "map") {
        const obj: Record<string, unknown> = {};
        for (const e of scVal.entries) {
          const key = e.key.value;
          obj[key] = e.val;
        }
        return obj;
      }
      if (scVal.type === "vec") {
        if (scVal.vals.length === 1) return [scVal.vals[0].value];
        return [scVal.vals[0].value, scVal.vals[1].value.lo];
      }
      return scVal;
    },
    rpc: {
      Server: function () { },
      Api: {
        GetTransactionResponse: {},
        isSimulationError: (sim: { error?: string }) => !!sim.error,
      },
    },
  };
});

const TEST_ADDR = "GDXMWQDVZ5DORJFPIPUDFRML2OEPBMSG77J2TIIGWRIBSRWPT5EK2GG5";

describe("mapStatus", () => {
  it("maps Created → created", () => {
    expect(mapStatus("Created")).toBe("created");
    expect(mapStatus(["Created"])).toBe("created");
  });

  it("maps Released → released", () => {
    expect(mapStatus("Released")).toBe("released");
    expect(mapStatus(["Released"])).toBe("released");
  });

  it("maps Refunded → refunded", () => {
    expect(mapStatus("Refunded")).toBe("refunded");
    expect(mapStatus(["Refunded"])).toBe("refunded");
  });

  it("defaults to created for unknown", () => {
    expect(mapStatus("Unknown")).toBe("created");
  });
});

describe("mapEscrowData", () => {
  const raw: RawEscrowData = {
    depositor: TEST_ADDR,
    beneficiary: "GBENEFICIARY",
    resolver: "GRESOLVER",
    token: "CDTOKEN",
    amount: BigInt(1000000),
    status: ["Created"],
    nonce: BigInt(0),
    created_at: BigInt(1234567890),
  };

  it("maps to Escrow with correct fields", () => {
    const escrow = mapEscrowData(raw, "stellar-local");
    expect(escrow.id).toBe("0");
    expect(escrow.chainId).toBe("stellar-local");
    expect(escrow.depositor).toBe(TEST_ADDR);
    expect(escrow.beneficiary).toBe("GBENEFICIARY");
    expect(escrow.amount).toBe("1000000");
    expect(escrow.amountRaw).toBe("1000000");
    expect(escrow.status).toBe("created");
    expect(escrow.createdAt).toBe(1234567890);
  });
});

describe("makeEscrowKey", () => {
  it("creates a vec ScVal with Escrow symbol and nonce", () => {
    const key = makeEscrowKey(BigInt(0));
    expect(key).toBeDefined();
  });
});

describe("makeCounterKey", () => {
  it("creates a vec ScVal with Counter symbol", () => {
    const key = makeCounterKey();
    expect(key).toBeDefined();
  });
});

describe("fetchEscrowAccount", () => {
  const mockServer: any = {
    getContractData: vi.fn(),
  };

  const ctx: QueryContext = {
    server: mockServer,
    contractId: "CBKOJJYWY2KOQRSXJIT2LRSORTCJFZ7DFHZB4QDDRK7BD5GVCRCHQYSS",
    chainId: "stellar-local",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when getContractData throws", async () => {
    mockServer.getContractData.mockRejectedValueOnce(new Error("not found"));
    const result = await fetchEscrowAccount(ctx, "0");
    expect(result).toBeNull();
  });

  it("returns Escrow when data exists", async () => {
    mockServer.getContractData.mockResolvedValueOnce({
      val: {
        contractData: {
          val: {
            type: "map",
            entries: [
              { key: { value: "depositor" }, val: TEST_ADDR },
              { key: { value: "beneficiary" }, val: "GBENEF" },
              { key: { value: "resolver" }, val: "GRESOLV" },
              { key: { value: "token" }, val: "CDTOKEN" },
              { key: { value: "amount" }, val: BigInt(1000) },
              { key: { value: "status" }, val: { type: "vec", vals: [{ value: "Created" }] } },
              { key: { value: "nonce" }, val: BigInt(0) },
              { key: { value: "created_at" }, val: BigInt(123) },
            ],
          },
        },
      },
    });
    const result = await fetchEscrowAccount(ctx, "0");
    expect(result).not.toBeNull();
    expect(result!.depositor).toBe(TEST_ADDR);
    expect(result!.id).toBe("0");
  });
});

describe("listEscrowAccountsByUser", () => {
  const mockServer: any = {
    getContractData: vi.fn(),
  };

  const ctx: QueryContext = {
    server: mockServer,
    contractId: "CBKOJJYWY2KOQRSXJIT2LRSORTCJFZ7DFHZB4QDDRK7BD5GVCRCHQYSS",
    chainId: "stellar-local",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when counter read fails", async () => {
    mockServer.getContractData.mockRejectedValueOnce(new Error("not found"));
    const result = await listEscrowAccountsByUser(ctx, TEST_ADDR);
    expect(result).toEqual([]);
  });

  it("iterates 0..counter and filters by depositor", async () => {
    // First call: counter = 2
    mockServer.getContractData
      .mockResolvedValueOnce({
        val: {
          contractData: {
            val: 2,
          },
        },
      })
      // Escrow 0: depositor matches
      .mockResolvedValueOnce({
        val: {
          contractData: {
            val: {
              type: "map",
              entries: [
                { key: { value: "depositor" }, val: TEST_ADDR },
                { key: { value: "beneficiary" }, val: "GBENEF" },
                { key: { value: "resolver" }, val: "GRESOLV" },
                { key: { value: "token" }, val: "CDTOKEN" },
                { key: { value: "amount" }, val: BigInt(1000) },
                { key: { value: "status" }, val: { type: "vec", vals: [{ value: "Created" }] } },
                { key: { value: "nonce" }, val: BigInt(0) },
                { key: { value: "created_at" }, val: BigInt(123) },
              ],
            },
          },
        },
      })
      // Escrow 1: depositor does not match
      .mockResolvedValueOnce({
        val: {
          contractData: {
            val: {
              type: "map",
              entries: [
                { key: { value: "depositor" }, val: "GOTHER" },
                { key: { value: "beneficiary" }, val: "GBENEF" },
                { key: { value: "resolver" }, val: "GRESOLV" },
                { key: { value: "token" }, val: "CDTOKEN" },
                { key: { value: "amount" }, val: BigInt(2000) },
                { key: { value: "status" }, val: { type: "vec", vals: [{ value: "Created" }] } },
                { key: { value: "nonce" }, val: BigInt(1) },
                { key: { value: "created_at" }, val: BigInt(456) },
              ],
            },
          },
        },
      });

    const result = await listEscrowAccountsByUser(ctx, TEST_ADDR);
    expect(result).toHaveLength(1);
    expect(result[0].depositor).toBe(TEST_ADDR);
    expect(result[0].id).toBe("0");
  });
});
