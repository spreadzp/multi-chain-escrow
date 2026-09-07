import { describe, it, expect, beforeEach } from "vitest";
import { MockEscrowAdapter } from "./MockEscrowAdapter";
import { clearStorage } from "./mock-persist";
import type { EscrowEvent, ChainId } from "@/shared/types";

const CHAIN_ID: ChainId = "solana-devnet";
const DEPOSITOR = "0xDep";
const BENEFICIARY = "0xBen";
const RESOLVER = "0xRes";
const OTHER = "0xOther";

function makeAdapter(walletAddress = DEPOSITOR): MockEscrowAdapter {
  const adapter = new MockEscrowAdapter(CHAIN_ID);
  adapter.setWalletAddress(walletAddress);
  return adapter;
}

describe("MockEscrowAdapter", () => {
  let adapter: MockEscrowAdapter;

  beforeEach(() => {
    clearStorage(CHAIN_ID);
    adapter = makeAdapter();
  });

  describe("createEscrow", () => {
    it("creates escrow with status created and returns escrowId + txHash", async () => {
      const result = await adapter.createEscrow({
        beneficiary: BENEFICIARY,
        amount: "100",
      });

      expect(result.escrowId).toMatch(/^mock-esc-/);
      expect(result.txHash).toMatch(/^mock-tx-/);
    });

    it("stores escrow in internal map (retrievable via getEscrow)", async () => {
      const { escrowId } = await adapter.createEscrow({
        beneficiary: BENEFICIARY,
        amount: "100",
        resolver: RESOLVER,
      });

      const escrow = await adapter.getEscrow(escrowId);
      expect(escrow).not.toBeNull();
      expect(escrow!.status).toBe("created");
      expect(escrow!.depositor).toBe(DEPOSITOR);
      expect(escrow!.beneficiary).toBe(BENEFICIARY);
      expect(escrow!.resolver).toBe(RESOLVER);
      expect(escrow!.amount).toBe("100");
    });

    it("emits Deposited event", async () => {
      const events: EscrowEvent[] = [];
      adapter.subscribeEvents((e: EscrowEvent) => events.push(e));

      await adapter.createEscrow({
        beneficiary: BENEFICIARY,
        amount: "100",
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("Deposited");
      expect(events[0].chainId).toBe(CHAIN_ID);
    });

    it("throws not_connected when walletAddress is empty", async () => {
      const emptyAdapter = new MockEscrowAdapter(CHAIN_ID);

      await expect(
        emptyAdapter.createEscrow({ beneficiary: BENEFICIARY, amount: "100" }),
      ).rejects.toMatchObject({ code: "not_connected" });
    });
  });

  describe("releaseEscrow", () => {
    it("patches status to released and emits Released event", async () => {
      const events: EscrowEvent[] = [];
      adapter.subscribeEvents((e: EscrowEvent) => events.push(e));

      const { escrowId } = await adapter.createEscrow({
        beneficiary: BENEFICIARY,
        amount: "100",
        resolver: RESOLVER,
      });

      adapter.setWalletAddress(BENEFICIARY);
      const result = await adapter.releaseEscrow(escrowId);

      expect(result.txHash).toMatch(/^mock-tx-/);

      const escrow = await adapter.getEscrow(escrowId);
      expect(escrow!.status).toBe("released");

      expect(events).toHaveLength(2);
      expect(events[1].type).toBe("Released");
    });

    it("throws insufficient_permissions when caller is not beneficiary/resolver", async () => {
      const { escrowId } = await adapter.createEscrow({
        beneficiary: BENEFICIARY,
        amount: "100",
        resolver: RESOLVER,
      });

      adapter.setWalletAddress(DEPOSITOR);

      await expect(adapter.releaseEscrow(escrowId)).rejects.toMatchObject({
        code: "insufficient_permissions",
      });
    });

    it("throws escrow_not_found for unknown id", async () => {
      await expect(adapter.releaseEscrow("unknown")).rejects.toMatchObject({
        code: "escrow_not_found",
      });
    });

    it("throws not_connected when walletAddress is empty", async () => {
      const emptyAdapter = new MockEscrowAdapter(CHAIN_ID);
      await expect(emptyAdapter.releaseEscrow("any")).rejects.toMatchObject({
        code: "not_connected",
      });
    });
  });

  describe("refundEscrow", () => {
    it("patches status to refunded and emits Refunded event", async () => {
      const events: EscrowEvent[] = [];
      adapter.subscribeEvents((e: EscrowEvent) => events.push(e));

      const { escrowId } = await adapter.createEscrow({
        beneficiary: BENEFICIARY,
        amount: "100",
      });

      const result = await adapter.refundEscrow(escrowId);

      expect(result.txHash).toMatch(/^mock-tx-/);

      const escrow = await adapter.getEscrow(escrowId);
      expect(escrow!.status).toBe("refunded");

      expect(events).toHaveLength(2);
      expect(events[1].type).toBe("Refunded");
    });

    it("throws insufficient_permissions when caller is not depositor", async () => {
      const { escrowId } = await adapter.createEscrow({
        beneficiary: BENEFICIARY,
        amount: "100",
      });

      adapter.setWalletAddress(OTHER);

      await expect(adapter.refundEscrow(escrowId)).rejects.toMatchObject({
        code: "insufficient_permissions",
      });
    });

    it("throws insufficient_permissions when status is not created", async () => {
      const { escrowId } = await adapter.createEscrow({
        beneficiary: BENEFICIARY,
        amount: "100",
        resolver: RESOLVER,
      });

      adapter.setWalletAddress(BENEFICIARY);
      await adapter.releaseEscrow(escrowId);

      adapter.setWalletAddress(DEPOSITOR);
      await expect(adapter.refundEscrow(escrowId)).rejects.toMatchObject({
        code: "insufficient_permissions",
      });
    });

    it("throws escrow_not_found for unknown id", async () => {
      await expect(adapter.refundEscrow("unknown")).rejects.toMatchObject({
        code: "escrow_not_found",
      });
    });

    it("throws not_connected when walletAddress is empty", async () => {
      const emptyAdapter = new MockEscrowAdapter(CHAIN_ID);
      await expect(emptyAdapter.refundEscrow("any")).rejects.toMatchObject({
        code: "not_connected",
      });
    });
  });

  describe("getEscrow", () => {
    it("returns null for unknown id", async () => {
      const result = await adapter.getEscrow("nonexistent");
      expect(result).toBeNull();
    });

    it("throws not_connected when walletAddress is empty", async () => {
      const emptyAdapter = new MockEscrowAdapter(CHAIN_ID);
      await expect(emptyAdapter.getEscrow("any")).rejects.toMatchObject({
        code: "not_connected",
      });
    });
  });

  describe("listEscrowsByUser", () => {
    it("returns escrows where address is depositor", async () => {
      await adapter.createEscrow({
        beneficiary: BENEFICIARY,
        amount: "100",
      });

      const list = await adapter.listEscrowsByUser(DEPOSITOR);
      expect(list).toHaveLength(1);
      expect(list[0].depositor).toBe(DEPOSITOR);
    });

    it("returns escrows where address is beneficiary", async () => {
      await adapter.createEscrow({
        beneficiary: BENEFICIARY,
        amount: "100",
      });

      const list = await adapter.listEscrowsByUser(BENEFICIARY);
      expect(list).toHaveLength(1);
    });

    it("returns escrows where address is resolver", async () => {
      await adapter.createEscrow({
        beneficiary: BENEFICIARY,
        amount: "100",
        resolver: RESOLVER,
      });

      const list = await adapter.listEscrowsByUser(RESOLVER);
      expect(list).toHaveLength(1);
    });

    it("returns empty array when no escrows match", async () => {
      const list = await adapter.listEscrowsByUser(OTHER);
      expect(list).toEqual([]);
    });

    it("throws not_connected when walletAddress is empty", async () => {
      const emptyAdapter = new MockEscrowAdapter(CHAIN_ID);
      await expect(
        emptyAdapter.listEscrowsByUser("any"),
      ).rejects.toMatchObject({ code: "not_connected" });
    });
  });

  describe("subscribeEvents", () => {
    it("callback receives events on create/release/refund", async () => {
      const events: EscrowEvent[] = [];
      adapter.subscribeEvents((e: EscrowEvent) => events.push(e));

      const { escrowId } = await adapter.createEscrow({
        beneficiary: BENEFICIARY,
        amount: "100",
        resolver: RESOLVER,
      });

      adapter.setWalletAddress(BENEFICIARY);
      await adapter.releaseEscrow(escrowId);

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe("Deposited");
      expect(events[1].type).toBe("Released");
    });

    it("unsubscribe function stops callbacks", async () => {
      const events: EscrowEvent[] = [];
      const unsub = adapter.subscribeEvents((e: EscrowEvent) => events.push(e));

      unsub();

      await adapter.createEscrow({
        beneficiary: BENEFICIARY,
        amount: "100",
      });

      expect(events).toHaveLength(0);
    });
  });

  describe("setWalletAddress", () => {
    it("stores wallet address for use in createEscrow", async () => {
      adapter.setWalletAddress("0xNewWallet");
      const { escrowId } = await adapter.createEscrow({
        beneficiary: BENEFICIARY,
        amount: "100",
      });

      const escrow = await adapter.getEscrow(escrowId);
      expect(escrow!.depositor).toBe("0xNewWallet");
    });
  });

  describe("artificial delay", () => {
    it("createEscrow resolves within 150-600ms", async () => {
      const start = Date.now();
      await adapter.createEscrow({
        beneficiary: BENEFICIARY,
        amount: "100",
      });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(150);
      expect(elapsed).toBeLessThanOrEqual(600);
    });
  });

  describe("chainId", () => {
    it("has chainId set per instance", () => {
      expect(adapter.chainId).toBe(CHAIN_ID);
    });
  });
});
