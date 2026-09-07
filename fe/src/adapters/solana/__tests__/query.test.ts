// @vitest-environment node
import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import {
  mapEscrowAccount,
  DEPOSITOR_OFFSET,
  BENEFICIARY_OFFSET,
  type RawEscrowAccount,
} from "../query";
import { SolanaEscrowAdapter } from "../index";

const ESCROW_PDA = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const DEPOSITOR = new PublicKey("8Drae1LC1vvdxoi6ofH1TEnDdovHQUfM44X3rT6KmsJM");
const BENEFICIARY = new PublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");
const RESOLVER = new PublicKey("11111111111111111111111111111111");
const MINT = new PublicKey("So11111111111111111111111111111111111111112");

const mockRaw: RawEscrowAccount = {
  depositor: DEPOSITOR,
  beneficiary: BENEFICIARY,
  resolver: RESOLVER,
  mint: MINT,
  amount: BigInt(500_000_000),
  status: { created: {} },
  nonce: BigInt(1),
  bump: 255,
  createdAt: BigInt(1700000000),
  txHashDeposit: Array(32).fill(0),
};

describe("SolanaEscrowAdapter — query (SLICE-08-4)", () => {
  it("DEPOSITOR_OFFSET is 8 (after discriminator)", () => {
    expect(DEPOSITOR_OFFSET).toBe(8);
  });

  it("BENEFICIARY_OFFSET is 40 (8 + 32)", () => {
    expect(BENEFICIARY_OFFSET).toBe(40);
  });

  it("mapEscrowAccount maps created status", () => {
    const escrow = mapEscrowAccount(mockRaw, ESCROW_PDA, "solana-local");
    expect(escrow.id).toBe(ESCROW_PDA.toBase58());
    expect(escrow.chainId).toBe("solana-local");
    expect(escrow.depositor).toBe(DEPOSITOR.toBase58());
    expect(escrow.beneficiary).toBe(BENEFICIARY.toBase58());
    expect(escrow.resolver).toBe(RESOLVER.toBase58());
    expect(escrow.tokenAddress).toBe(MINT.toBase58());
    expect(escrow.amount).toBe("500000000");
    expect(escrow.status).toBe("created");
    expect(escrow.createdAt).toBe(1700000000);
  });

  it("mapEscrowAccount maps released status", () => {
    const raw = { ...mockRaw, status: { released: {} } };
    const escrow = mapEscrowAccount(raw, ESCROW_PDA, "solana-local");
    expect(escrow.status).toBe("released");
  });

  it("mapEscrowAccount maps refunded status", () => {
    const raw = { ...mockRaw, status: { refunded: {} } };
    const escrow = mapEscrowAccount(raw, ESCROW_PDA, "solana-local");
    expect(escrow.status).toBe("refunded");
  });

  it("mapEscrowAccount converts txHashDeposit to hex string", () => {
    const raw = { ...mockRaw, txHashDeposit: [1, 2, 3, ...Array(29).fill(0)] };
    const escrow = mapEscrowAccount(raw, ESCROW_PDA, "solana-local");
    expect(escrow.txHashDeposit).toBe(
      "0102030000000000000000000000000000000000000000000000000000000000",
    );
  });

  it("getEscrow throws if wallet not set", async () => {
    const adapter = new SolanaEscrowAdapter("solana-local");
    await expect(adapter.getEscrow(ESCROW_PDA.toBase58())).rejects.toThrow(
      "Wallet address not set",
    );
  });

  it("listEscrowsByUser throws if wallet not set", async () => {
    const adapter = new SolanaEscrowAdapter("solana-local");
    await expect(adapter.listEscrowsByUser(DEPOSITOR.toBase58())).rejects.toThrow(
      "Wallet address not set",
    );
  });

  it("fetchEscrowAccount returns null for non-existent account", async () => {
    // This test verifies the function exists and handles errors gracefully
    // Full integration test requires a running validator
    const adapter = new SolanaEscrowAdapter("solana-local");
    adapter.setWalletAddress(DEPOSITOR.toBase58());
    // Will fail to connect to localhost:8899, but the function should handle it
    // by returning null (catch block)
    const result = await adapter.getEscrow(ESCROW_PDA.toBase58());
    expect(result).toBeNull();
  });
});
