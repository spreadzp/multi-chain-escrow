import { describe, it, expect, beforeEach } from "vitest";
import { MockWalletProvider, generateMockAddress } from "./mock-wallet";

describe("generateMockAddress", () => {
  it("generates Solana address starting with MockSolana", () => {
    const addr = generateMockAddress("solana", "seed-123");
    expect(addr.startsWith("MockSolana")).toBe(true);
  });

  it("generates Stellar address starting with G and 56 chars", () => {
    const addr = generateMockAddress("stellar", "seed-123");
    expect(addr.startsWith("G")).toBe(true);
    expect(addr.length).toBe(56);
  });

  it("is deterministic with same seed", () => {
    const a1 = generateMockAddress("solana", "same-seed");
    const a2 = generateMockAddress("solana", "same-seed");
    expect(a1).toBe(a2);
  });

  it("produces different addresses with different seeds", () => {
    const a1 = generateMockAddress("solana", "seed-a");
    const a2 = generateMockAddress("solana", "seed-b");
    expect(a1).not.toBe(a2);
  });
});

describe("MockWalletProvider", () => {
  let provider: MockWalletProvider;

  beforeEach(() => {
    provider = new MockWalletProvider("solana", "solana-devnet");
  });

  it("isAvailable returns true", () => {
    expect(provider.isAvailable()).toBe(true);
  });

  it("connect returns WalletSession with non-empty address", async () => {
    const session = await provider.connect();
    expect(session.address).toBeTruthy();
    expect(session.address.length).toBeGreaterThan(0);
    expect(session.chainId).toBe("solana-devnet");
    expect(session.connectedAt).toBeGreaterThan(0);
  });

  it("Solana mock address starts with MockSolana", async () => {
    const session = await provider.connect();
    expect(session.address.startsWith("MockSolana")).toBe(true);
  });

  it("Stellar mock address starts with G and is 56 chars", async () => {
    const stellarProvider = new MockWalletProvider("stellar", "stellar-testnet");
    const session = await stellarProvider.connect();
    expect(session.address.startsWith("G")).toBe(true);
    expect(session.address.length).toBe(56);
  });

  it("getAddress returns null before connect", () => {
    expect(provider.getAddress()).toBeNull();
  });

  it("getAddress returns address after connect", async () => {
    await provider.connect();
    expect(provider.getAddress()).toBeTruthy();
  });

  it("disconnect clears address", async () => {
    await provider.connect();
    expect(provider.getAddress()).toBeTruthy();
    await provider.disconnect();
    expect(provider.getAddress()).toBeNull();
  });

  it("chainFamily matches constructor argument", () => {
    expect(provider.chainFamily).toBe("solana");
  });

  it("deterministic mode: same seed produces same address", async () => {
    const p1 = new MockWalletProvider("solana", "solana-devnet", "test-seed");
    const p2 = new MockWalletProvider("solana", "solana-devnet", "test-seed");
    const s1 = await p1.connect();
    const s2 = await p2.connect();
    expect(s1.address).toBe(s2.address);
  });
});
