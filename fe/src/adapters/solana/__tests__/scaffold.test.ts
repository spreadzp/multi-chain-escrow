import { describe, it, expect } from "vitest";
import { PublicKey, Keypair } from "@solana/web3.js";
import { createConnection, createProgram, createKeypairWallet, getProgramId } from "../connection";
import { SolanaEscrowAdapter, createSolanaAdapter } from "../index";

describe("SolanaEscrowAdapter — scaffold (SLICE-08-1)", () => {
  it("creates adapter with correct chainId", () => {
    const adapter = new SolanaEscrowAdapter("solana-local");
    expect(adapter.chainId).toBe("solana-local");
  });

  it("createSolanaAdapter factory returns SolanaEscrowAdapter", () => {
    const adapter = createSolanaAdapter("solana-local");
    expect(adapter).toBeInstanceOf(SolanaEscrowAdapter);
    expect(adapter.chainId).toBe("solana-local");
  });

  it("setWalletAddress stores address", () => {
    const adapter = new SolanaEscrowAdapter("solana-local");
    adapter.setWalletAddress("MockSolana123");
    expect(() => adapter.setWalletAddress("MockSolana456")).not.toThrow();
  });

  it("getProgram throws if wallet not set", () => {
    const adapter = new SolanaEscrowAdapter("solana-local");
    expect(() => (adapter as unknown as { getProgram: () => unknown }).getProgram()).toThrow(
      "Wallet address not set",
    );
  });

  it("createConnection returns Connection with correct RPC URL", () => {
    const conn = createConnection("solana-local");
    expect(conn.rpcEndpoint).toBe("http://localhost:8899");
  });

  it("getProgramId returns correct program ID from config", () => {
    const programId = getProgramId("solana-local");
    expect(programId.toBase58()).toBe("BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj");
  });

  it("createKeypairWallet returns wallet with correct publicKey", () => {
    const keypair = Keypair.generate();
    const wallet = createKeypairWallet(keypair);
    expect(wallet.publicKey.toBase58()).toBe(keypair.publicKey.toBase58());
  });

  it("createProgram returns Program instance", () => {
    const conn = createConnection("solana-local");
    const keypair = Keypair.generate();
    const wallet = createKeypairWallet(keypair);
    const program = createProgram(conn, wallet, "solana-local");
    expect(program).toBeDefined();
    expect(program.programId).toBeDefined();
  });

  it("implements EscrowAdapter interface — all methods present", () => {
    const adapter = new SolanaEscrowAdapter("solana-local");
    expect(typeof adapter.createEscrow).toBe("function");
    expect(typeof adapter.releaseEscrow).toBe("function");
    expect(typeof adapter.refundEscrow).toBe("function");
    expect(typeof adapter.getEscrow).toBe("function");
    expect(typeof adapter.listEscrowsByUser).toBe("function");
    expect(typeof adapter.subscribeEvents).toBe("function");
    expect(typeof adapter.setWalletAddress).toBe("function");
  });

  it("createEscrow throws if wallet not set", async () => {
    const adapter = new SolanaEscrowAdapter("solana-local");
    await expect(
      adapter.createEscrow({ beneficiary: "x", amount: "100" }),
    ).rejects.toThrow("Wallet address not set");
  });

  it("subscribeEvents returns a cleanup function", () => {
    const adapter = new SolanaEscrowAdapter("solana-local");
    const unsub = adapter.subscribeEvents(() => { });
    expect(typeof unsub).toBe("function");
    unsub();
  });
});
