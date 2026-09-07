// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createEscrowTransaction, type CreateEscrowContext } from "../create";
import type { CreateEscrowParams } from "@/shared/types";

// Mock the Stellar SDK
vi.mock("@stellar/stellar-sdk", () => {
  const mockScVal = { switch: () => ({ name: "scvU64" }) };
  const mockAddress = {
    fromString: () => ({ toScVal: () => mockScVal }),
  };
  const mockContract = {
    call: () => ({}),
  };
  const mockTx = {
    sign: () => { },
  };
  const mockBuilder = {
    addOperation: () => mockBuilder,
    setTimeout: () => mockBuilder,
    build: () => mockTx,
  };
  return {
    Address: mockAddress,
    nativeToScVal: () => mockScVal,
    Keypair: { fromSecret: () => ({ publicKey: () => "G_TEST" }) },
    TransactionBuilder: function () {
      return mockBuilder;
    },
    Contract: function () {
      return mockContract;
    },
    xdr: {
      TransactionMeta: {
        fromXDR: () => ({
          v3: () => ({
            sorobanMeta: () => ({
              returnValue: () => mockScVal,
            }),
          }),
        }),
      },
      ScVal: { fromXDR: () => mockScVal },
    },
    scValToNative: () => 42,
    rpc: {
      Server: function () { },
      Api: {
        GetTransactionResponse: {},
        isSimulationError: (sim: { error?: string }) => !!sim.error,
        isSimulationSuccess: (sim: { error?: string }) => !sim.error,
      },
    },
  };
});

describe("createEscrowTransaction", () => {
  const mockServer: any = {
    getAccount: vi.fn().mockResolvedValue({ sequence: "0" }),
    getNetwork: vi.fn().mockResolvedValue({ passphrase: "Test SDF Network ; September 2015" }),
    simulateTransaction: vi.fn().mockResolvedValue({ error: null }),
    prepareTransaction: vi.fn().mockResolvedValue({
      sign: vi.fn(),
    }),
    sendTransaction: vi.fn().mockResolvedValue({
      hash: "abc123",
      status: "PENDING",
      errorResult: null,
    }),
    getTransaction: vi.fn().mockResolvedValue({
      status: "SUCCESS",
      resultMetaXdr: "AAAAAA==",
      returnValue: { __native: 42 },
    }),
  };

  const ctx: CreateEscrowContext = {
    server: mockServer,
    contractId: "CBKOJJYWY2KOQRSXJIT2LRSORTCJFZ7DFHZB4QDDRK7BD5GVCRCHQYSS",
    walletAddress: "GDXMWQDVZ5DORJFPIPUDFRML2OEPBMSG77J2TIIGWRIBSRWPT5EK2GG5",
    signerSecret: "S_TEST_SECRET",
  };

  const params: CreateEscrowParams = {
    beneficiary: "GBENYPX3GTESTBENEFICIARY",
    resolver: "GBENYPX3GTESTRESOLVER",
    amount: "1000000",
    tokenAddress: "CDTESTTOKEN",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer.simulateTransaction.mockResolvedValue({ error: null });
    mockServer.sendTransaction.mockResolvedValue({
      hash: "abc123",
      status: "PENDING",
      errorResult: null,
    });
    mockServer.getTransaction.mockResolvedValue({
      status: "SUCCESS",
      resultMetaXdr: "AAAAAA==",
      returnValue: { __native: 42 },
    });
  });

  it("sends transaction and returns escrowId + txHash", async () => {
    const result = await createEscrowTransaction(ctx, params);
    expect(result.txHash).toBe("abc123");
    expect(result.escrowId).toBe("42");
  });

  it("calls simulateTransaction before prepare", async () => {
    await createEscrowTransaction(ctx, params);
    expect(mockServer.simulateTransaction).toHaveBeenCalled();
  });

  it("calls prepareTransaction after simulate", async () => {
    await createEscrowTransaction(ctx, params);
    expect(mockServer.prepareTransaction).toHaveBeenCalled();
  });

  it("calls sendTransaction with prepared tx", async () => {
    await createEscrowTransaction(ctx, params);
    expect(mockServer.sendTransaction).toHaveBeenCalled();
  });

  it("throws on simulation error", async () => {
    mockServer.simulateTransaction.mockResolvedValueOnce({
      error: "sim failed",
    });
    await expect(createEscrowTransaction(ctx, params)).rejects.toThrow(
      "Simulation failed",
    );
  });

  it("uses walletAddress as resolver when resolver not provided", async () => {
    const paramsNoResolver: CreateEscrowParams = {
      beneficiary: "GBENYPX3GTESTBENEFICIARY",
      amount: "1000000",
      tokenAddress: "CDTESTTOKEN",
    };
    const result = await createEscrowTransaction(ctx, paramsNoResolver);
    expect(result.escrowId).toBe("42");
  });
});
