// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { releaseEscrowTransaction } from "../release";
import { refundEscrowTransaction } from "../refund";
import type { TxContext } from "../tx";

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
    sign: () => {},
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
      Server: function () {},
      Api: {
        GetTransactionResponse: {},
        isSimulationError: (sim: { error?: string }) => !!sim.error,
        isSimulationSuccess: (sim: { error?: string }) => !sim.error,
      },
    },
  };
});

describe("releaseEscrowTransaction", () => {
  const mockServer: any = {
    getAccount: vi.fn().mockResolvedValue({ sequence: "0" }),
    getNetwork: vi.fn().mockResolvedValue({ passphrase: "Test SDF Network ; September 2015" }),
    simulateTransaction: vi.fn().mockResolvedValue({ error: null }),
    prepareTransaction: vi.fn().mockResolvedValue({ sign: vi.fn() }),
    sendTransaction: vi.fn().mockResolvedValue({
      hash: "release_hash",
      status: "PENDING",
      errorResult: null,
    }),
    getTransaction: vi.fn().mockResolvedValue({
      status: "SUCCESS",
      resultMetaXdr: "AAAAAA==",
    }),
  };

  const ctx: TxContext = {
    server: mockServer,
    contractId: "CBKOJJYWY2KOQRSXJIT2LRSORTCJFZ7DFHZB4QDDRK7BD5GVCRCHQYSS",
    walletAddress: "GBENEFICIARY",
    signerSecret: "S_TEST",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer.simulateTransaction.mockResolvedValue({ error: null });
    mockServer.sendTransaction.mockResolvedValue({
      hash: "release_hash",
      status: "PENDING",
      errorResult: null,
    });
    mockServer.getTransaction.mockResolvedValue({
      status: "SUCCESS",
      resultMetaXdr: "AAAAAA==",
    });
  });

  it("returns txHash on success", async () => {
    const result = await releaseEscrowTransaction(ctx, "0");
    expect(result.txHash).toBe("release_hash");
  });

  it("calls simulate → prepare → send", async () => {
    await releaseEscrowTransaction(ctx, "0");
    expect(mockServer.simulateTransaction).toHaveBeenCalled();
    expect(mockServer.prepareTransaction).toHaveBeenCalled();
    expect(mockServer.sendTransaction).toHaveBeenCalled();
  });

  it("throws on simulation error", async () => {
    mockServer.simulateTransaction.mockResolvedValueOnce({ error: "fail" });
    await expect(releaseEscrowTransaction(ctx, "0")).rejects.toThrow("Simulation failed");
  });

  it("throws on send ERROR status", async () => {
    mockServer.sendTransaction.mockResolvedValueOnce({
      hash: "bad",
      status: "ERROR",
      errorResult: "bad tx",
    });
    await expect(releaseEscrowTransaction(ctx, "0")).rejects.toThrow("Send failed");
  });
});

describe("refundEscrowTransaction", () => {
  const mockServer: any = {
    getAccount: vi.fn().mockResolvedValue({ sequence: "0" }),
    getNetwork: vi.fn().mockResolvedValue({ passphrase: "Test SDF Network ; September 2015" }),
    simulateTransaction: vi.fn().mockResolvedValue({ error: null }),
    prepareTransaction: vi.fn().mockResolvedValue({ sign: vi.fn() }),
    sendTransaction: vi.fn().mockResolvedValue({
      hash: "refund_hash",
      status: "PENDING",
      errorResult: null,
    }),
    getTransaction: vi.fn().mockResolvedValue({
      status: "SUCCESS",
      resultMetaXdr: "AAAAAA==",
    }),
  };

  const ctx: TxContext = {
    server: mockServer,
    contractId: "CBKOJJYWY2KOQRSXJIT2LRSORTCJFZ7DFHZB4QDDRK7BD5GVCRCHQYSS",
    walletAddress: "GDEPOSITOR",
    signerSecret: "S_TEST",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer.simulateTransaction.mockResolvedValue({ error: null });
    mockServer.sendTransaction.mockResolvedValue({
      hash: "refund_hash",
      status: "PENDING",
      errorResult: null,
    });
    mockServer.getTransaction.mockResolvedValue({
      status: "SUCCESS",
      resultMetaXdr: "AAAAAA==",
    });
  });

  it("returns txHash on success", async () => {
    const result = await refundEscrowTransaction(ctx, "0");
    expect(result.txHash).toBe("refund_hash");
  });

  it("calls simulate → prepare → send", async () => {
    await refundEscrowTransaction(ctx, "0");
    expect(mockServer.simulateTransaction).toHaveBeenCalled();
    expect(mockServer.prepareTransaction).toHaveBeenCalled();
    expect(mockServer.sendTransaction).toHaveBeenCalled();
  });

  it("throws on simulation error", async () => {
    mockServer.simulateTransaction.mockResolvedValueOnce({ error: "fail" });
    await expect(refundEscrowTransaction(ctx, "0")).rejects.toThrow("Simulation failed");
  });
});
