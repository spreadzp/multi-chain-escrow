// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { Keypair, rpc as StellarRpc } from "@stellar/stellar-sdk";
import { StellarEscrowAdapter } from "../index";
import { loadStellarKeypair } from "./helpers";

const RPC_URL = "http://localhost:8000/rpc";
const NETWORK_PASSPHRASE = "Standalone Network ; February 2017";
const CONTRACT_ID = "CBKOJJYWY2KOQRSXJIT2LRSORTCJFZ7DFHZB4QDDRK7BD5GVCRCHQYSS";

// Native asset SAC contract address (from `soroban contract asset id --asset native`)
const NATIVE_SAC_CONTRACT = "CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4";

const depositor = loadStellarKeypair("depositor");
const beneficiary = loadStellarKeypair("beneficiary");
const resolver = loadStellarKeypair("resolver");
const deployer = loadStellarKeypair("deployer");

const ESCROW_AMOUNT = "10000000"; // 1 XLM in stroops

describe("StellarEscrowAdapter — integration (SLICE-09-6)", () => {
  let adapter: StellarEscrowAdapter;
  let escrowId: string;
  let createTxHash: string;

  beforeAll(() => {
    adapter = new StellarEscrowAdapter("stellar-local");
    adapter.setSignerSecret(deployer.secretKey);
  });

  describe("create → release happy path", () => {
    it("creates escrow with XLM token", async () => {
      // Use deployer as depositor (has XLM balance)
      adapter.setWalletAddress(deployer.publicKey);

      const result = await adapter.createEscrow({
        beneficiary: beneficiary.publicKey,
        resolver: resolver.publicKey,
        amount: ESCROW_AMOUNT,
        tokenAddress: NATIVE_SAC_CONTRACT,
      });

      expect(result.escrowId).toBeDefined();
      expect(result.txHash).toBeDefined();
      escrowId = result.escrowId;
      createTxHash = result.txHash;
    }, 60000);

    it("getEscrow returns created escrow", async () => {
      const escrow = await adapter.getEscrow(escrowId);
      expect(escrow).not.toBeNull();
      expect(escrow!.id).toBe(escrowId);
      expect(escrow!.status).toBe("created");
      expect(escrow!.depositor).toBe(deployer.publicKey);
      expect(escrow!.beneficiary).toBe(beneficiary.publicKey);
      expect(escrow!.amount).toBe(ESCROW_AMOUNT);
    }, 30000);

    it("releases escrow to beneficiary", async () => {
      // Set wallet to beneficiary for release
      adapter.setWalletAddress(beneficiary.publicKey);
      adapter.setSignerSecret(beneficiary.secretKey);

      const result = await adapter.releaseEscrow(escrowId);
      expect(result.txHash).toBeDefined();

      // Reset to deployer for further tests
      adapter.setWalletAddress(deployer.publicKey);
      adapter.setSignerSecret(deployer.secretKey);
    }, 60000);

    it("getEscrow shows released status", async () => {
      const escrow = await adapter.getEscrow(escrowId);
      expect(escrow).not.toBeNull();
      expect(escrow!.status).toBe("released");
    }, 30000);
  });

  describe("create → refund happy path", () => {
    let refundEscrowId: string;

    it("creates escrow for refund", async () => {
      adapter.setWalletAddress(deployer.publicKey);
      adapter.setSignerSecret(deployer.secretKey);

      const result = await adapter.createEscrow({
        beneficiary: beneficiary.publicKey,
        resolver: resolver.publicKey,
        amount: ESCROW_AMOUNT,
        tokenAddress: NATIVE_SAC_CONTRACT,
      });

      expect(result.escrowId).toBeDefined();
      refundEscrowId = result.escrowId;
    }, 60000);

    it("refunds escrow to depositor", async () => {
      // Depositor calls refund
      const result = await adapter.refundEscrow(refundEscrowId);
      expect(result.txHash).toBeDefined();
    }, 60000);

    it("getEscrow shows refunded status", async () => {
      const escrow = await adapter.getEscrow(refundEscrowId);
      expect(escrow).not.toBeNull();
      expect(escrow!.status).toBe("refunded");
    }, 30000);
  });

  describe("role denial", () => {
    it("non-depositor cannot refund", async () => {
      // Create escrow as deployer
      adapter.setWalletAddress(deployer.publicKey);
      adapter.setSignerSecret(deployer.secretKey);

      const result = await adapter.createEscrow({
        beneficiary: beneficiary.publicKey,
        resolver: resolver.publicKey,
        amount: ESCROW_AMOUNT,
        tokenAddress: NATIVE_SAC_CONTRACT,
      });

      // Try to refund as beneficiary (not depositor)
      adapter.setWalletAddress(beneficiary.publicKey);
      adapter.setSignerSecret(beneficiary.secretKey);

      await expect(adapter.refundEscrow(result.escrowId)).rejects.toThrow();

      // Reset
      adapter.setWalletAddress(deployer.publicKey);
      adapter.setSignerSecret(deployer.secretKey);
    }, 60000);
  });

  describe("status transition errors", () => {
    it("cannot release a refunded escrow", async () => {
      // Create and refund
      adapter.setWalletAddress(deployer.publicKey);
      adapter.setSignerSecret(deployer.secretKey);

      const result = await adapter.createEscrow({
        beneficiary: beneficiary.publicKey,
        resolver: resolver.publicKey,
        amount: ESCROW_AMOUNT,
        tokenAddress: NATIVE_SAC_CONTRACT,
      });

      // Refund it
      await adapter.refundEscrow(result.escrowId);

      // Try to release the refunded escrow
      adapter.setWalletAddress(beneficiary.publicKey);
      adapter.setSignerSecret(beneficiary.secretKey);

      await expect(adapter.releaseEscrow(result.escrowId)).rejects.toThrow();

      // Reset
      adapter.setWalletAddress(deployer.publicKey);
      adapter.setSignerSecret(deployer.secretKey);
    }, 60000);
  });

  describe("listEscrowsByUser", () => {
    it("returns escrows where user is depositor", async () => {
      const escrows = await adapter.listEscrowsByUser(deployer.publicKey);
      expect(escrows.length).toBeGreaterThan(0);
      expect(escrows.every((e) => e.depositor === deployer.publicKey)).toBe(true);
    }, 30000);
  });

  describe("subscribeEvents", () => {
    it("returns a cleanup function", () => {
      const cleanup = adapter.subscribeEvents(() => { });
      expect(typeof cleanup).toBe("function");
      cleanup();
    });
  });
});
