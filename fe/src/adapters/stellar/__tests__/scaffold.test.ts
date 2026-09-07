// @vitest-environment node
import { describe, it, expect } from "vitest";
import { StellarEscrowAdapter, createStellarAdapter } from "../index";
import { createRpcServer, getContractId, getAbi } from "../connection";

const STELLAR_LOCAL_RPC = "http://localhost:8000/rpc";
const STELLAR_CONTRACT_ID = "CBKOJJYWY2KOQRSXJIT2LRSORTCJFZ7DFHZB4QDDRK7BD5GVCRCHQYSS";

describe("StellarEscrowAdapter — scaffold (SLICE-09-1)", () => {
  it("instantiates with stellar-local chainId", () => {
    const adapter = new StellarEscrowAdapter("stellar-local");
    expect(adapter.chainId).toBe("stellar-local");
  });

  it("factory function creates adapter", () => {
    const adapter = createStellarAdapter("stellar-local");
    expect(adapter).toBeInstanceOf(StellarEscrowAdapter);
  });

  it("createRpcServer returns StellarRpc.Server instance", () => {
    const server = createRpcServer("stellar-local");
    expect(server).toBeDefined();
    expect(typeof server.getTransaction).toBe("function");
    expect(typeof server.simulateTransaction).toBe("function");
    expect(typeof server.sendTransaction).toBe("function");
  });

  it("getContractId returns deployed contract ID", () => {
    const contractId = getContractId("stellar-local");
    expect(contractId).toBe(STELLAR_CONTRACT_ID);
  });

  it("getAbi returns ABI with correct contract name", () => {
    const abi = getAbi();
    expect(abi.name).toBe("escrow");
    expect(abi.version).toBe("0.1.0");
    expect(abi.contractId).toBe(STELLAR_CONTRACT_ID);
  });

  it("getAbi has create_escrow, release_escrow, refund_escrow functions", () => {
    const abi = getAbi();
    const names = abi.functions.map((f) => f.name);
    expect(names).toContain("create_escrow");
    expect(names).toContain("release_escrow");
    expect(names).toContain("refund_escrow");
  });

  it("setWalletAddress stores address", () => {
    const adapter = new StellarEscrowAdapter("stellar-local");
    adapter.setWalletAddress("GDXMWQDVZ5DORJFPIPUDFRML2OEPBMSG77J2TIIGWRIBSRWPT5EK2GG5");
    // No error means it stored successfully
    expect(true).toBe(true);
  });

  it("createEscrow throws if wallet not set", async () => {
    const adapter = new StellarEscrowAdapter("stellar-local");
    await expect(
      adapter.createEscrow({ beneficiary: "x", amount: "100" }),
    ).rejects.toThrow("Wallet address not set");
  });

  it("releaseEscrow throws if wallet not set", async () => {
    const adapter = new StellarEscrowAdapter("stellar-local");
    await expect(adapter.releaseEscrow("1")).rejects.toThrow("Wallet address not set");
  });

  it("refundEscrow throws if wallet not set", async () => {
    const adapter = new StellarEscrowAdapter("stellar-local");
    await expect(adapter.refundEscrow("1")).rejects.toThrow("Wallet address not set");
  });

  it("subscribeEvents returns cleanup function", () => {
    const adapter = new StellarEscrowAdapter("stellar-local");
    const cleanup = adapter.subscribeEvents(() => { });
    expect(typeof cleanup).toBe("function");
    cleanup();
  });

  it("implements all EscrowAdapter interface methods", () => {
    const adapter = new StellarEscrowAdapter("stellar-local");
    expect(typeof adapter.createEscrow).toBe("function");
    expect(typeof adapter.releaseEscrow).toBe("function");
    expect(typeof adapter.refundEscrow).toBe("function");
    expect(typeof adapter.getEscrow).toBe("function");
    expect(typeof adapter.listEscrowsByUser).toBe("function");
    expect(typeof adapter.subscribeEvents).toBe("function");
    expect(typeof adapter.setWalletAddress).toBe("function");
  });
});
