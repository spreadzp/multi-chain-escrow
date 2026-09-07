import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FreighterWalletProvider } from "./freighter-adapter";

interface MockFreighter {
  getAddress: ReturnType<typeof vi.fn>;
  isConnected: ReturnType<typeof vi.fn>;
  setAllowed: ReturnType<typeof vi.fn>;
}

describe("FreighterWalletProvider", () => {
  let provider: FreighterWalletProvider;
  let originalFreighter: unknown;

  beforeEach(() => {
    originalFreighter = (window as unknown as Record<string, unknown>).freighter;
    provider = new FreighterWalletProvider("stellar-testnet");
  });

  afterEach(() => {
    if (originalFreighter === undefined) {
      delete (window as unknown as Record<string, unknown>).freighter;
    } else {
      (window as unknown as Record<string, unknown>).freighter = originalFreighter;
    }
    vi.restoreAllMocks();
  });

  function setWindowFreighter(freighter: MockFreighter | undefined) {
    if (freighter === undefined) {
      delete (window as unknown as Record<string, unknown>).freighter;
    } else {
      (window as unknown as Record<string, unknown>).freighter = freighter;
    }
  }

  it("isAvailable returns false when window.freighter is undefined", () => {
    setWindowFreighter(undefined);
    expect(provider.isAvailable()).toBe(false);
  });

  it("isAvailable returns true when window.freighter is present", () => {
    setWindowFreighter({
      getAddress: vi.fn(),
      isConnected: vi.fn(),
      setAllowed: vi.fn(),
    });
    expect(provider.isAvailable()).toBe(true);
  });

  it("connect throws WalletError not_installed when extension missing", async () => {
    setWindowFreighter(undefined);
    await expect(provider.connect()).rejects.toMatchObject({
      name: "WalletError",
      code: "not_installed",
    });
  });

  it("connect throws WalletError rejected when setAllowed returns false", async () => {
    setWindowFreighter({
      getAddress: vi.fn(),
      isConnected: vi.fn(),
      setAllowed: vi.fn().mockResolvedValue(false),
    });
    await expect(provider.connect()).rejects.toMatchObject({
      name: "WalletError",
      code: "rejected",
    });
  });

  it("connect returns WalletSession with Stellar address starting with G", async () => {
    setWindowFreighter({
      getAddress: vi.fn().mockResolvedValue("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWH"),
      isConnected: vi.fn().mockReturnValue(true),
      setAllowed: vi.fn().mockResolvedValue(true),
    });
    const session = await provider.connect();
    expect(session.address.startsWith("G")).toBe(true);
    expect(session.chainId).toBe("stellar-testnet");
    expect(session.connectedAt).toBeGreaterThan(0);
  });

  it("connect calls setAllowed then getAddress", async () => {
    const setAllowed = vi.fn().mockResolvedValue(true);
    const getAddress = vi.fn().mockResolvedValue("GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWH");
    setWindowFreighter({
      getAddress,
      isConnected: vi.fn(),
      setAllowed,
    });
    await provider.connect();
    expect(setAllowed).toHaveBeenCalledOnce();
    expect(getAddress).toHaveBeenCalledOnce();
    expect(setAllowed.mock.invocationCallOrder[0]).toBeLessThan(
      getAddress.mock.invocationCallOrder[0],
    );
  });

  it("connect throws WalletError unknown when getAddress returns empty", async () => {
    setWindowFreighter({
      getAddress: vi.fn().mockResolvedValue(""),
      isConnected: vi.fn(),
      setAllowed: vi.fn().mockResolvedValue(true),
    });
    await expect(provider.connect()).rejects.toMatchObject({
      name: "WalletError",
      code: "unknown",
    });
  });

  it("getAddress returns null before connect", () => {
    expect(provider.getAddress()).toBeNull();
  });

  it("getAddress returns address after connect", async () => {
    setWindowFreighter({
      getAddress: vi.fn().mockResolvedValue("GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCWH"),
      isConnected: vi.fn(),
      setAllowed: vi.fn().mockResolvedValue(true),
    });
    await provider.connect();
    expect(provider.getAddress()).toBe("GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCWH");
  });

  it("disconnect clears cached address", async () => {
    setWindowFreighter({
      getAddress: vi.fn().mockResolvedValue("GDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDWH"),
      isConnected: vi.fn(),
      setAllowed: vi.fn().mockResolvedValue(true),
    });
    await provider.connect();
    expect(provider.getAddress()).toBeTruthy();
    await provider.disconnect();
    expect(provider.getAddress()).toBeNull();
  });

  it("chainFamily is stellar", () => {
    expect(provider.chainFamily).toBe("stellar");
  });

  it("connect throws WalletError unknown for unexpected errors", async () => {
    setWindowFreighter({
      getAddress: vi.fn().mockRejectedValue(new Error("Network error")),
      isConnected: vi.fn(),
      setAllowed: vi.fn().mockResolvedValue(true),
    });
    await expect(provider.connect()).rejects.toMatchObject({
      name: "WalletError",
      code: "unknown",
    });
  });
});
