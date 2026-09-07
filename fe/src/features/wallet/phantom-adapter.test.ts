import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PhantomWalletProvider } from "./phantom-adapter";

interface MockPhantom {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  isPhantom?: boolean;
  publicKey?: { toBase58: () => string };
}

function mockPublicKey(base58: string) {
  return { toBase58: () => base58 };
}

describe("PhantomWalletProvider", () => {
  let provider: PhantomWalletProvider;
  let originalSolana: unknown;

  beforeEach(() => {
    originalSolana = (window as unknown as Record<string, unknown>).solana;
    provider = new PhantomWalletProvider("solana-devnet");
  });

  afterEach(() => {
    if (originalSolana === undefined) {
      delete (window as unknown as Record<string, unknown>).solana;
    } else {
      (window as unknown as Record<string, unknown>).solana = originalSolana;
    }
    vi.restoreAllMocks();
  });

  function setWindowSolana(solana: MockPhantom | undefined) {
    if (solana === undefined) {
      delete (window as unknown as Record<string, unknown>).solana;
    } else {
      (window as unknown as Record<string, unknown>).solana = solana;
    }
  }

  it("isAvailable returns false when window.solana is undefined", () => {
    setWindowSolana(undefined);
    expect(provider.isAvailable()).toBe(false);
  });

  it("isAvailable returns true when window.solana is present", () => {
    setWindowSolana({
      connect: vi.fn(),
      disconnect: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      isPhantom: true,
    });
    expect(provider.isAvailable()).toBe(true);
  });

  it("connect throws WalletError not_installed when extension missing", async () => {
    setWindowSolana(undefined);
    await expect(provider.connect()).rejects.toMatchObject({
      name: "WalletError",
      code: "not_installed",
    });
  });

  it("connect throws WalletError rejected when user rejects", async () => {
    setWindowSolana({
      connect: vi.fn().mockRejectedValue(new Error("User rejected")),
      disconnect: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    });
    await expect(provider.connect()).rejects.toMatchObject({
      name: "WalletError",
      code: "rejected",
    });
  });

  it("connect returns WalletSession with base58 address on success", async () => {
    const pk = mockPublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");
    setWindowSolana({
      connect: vi.fn().mockResolvedValue({ publicKey: pk }),
      disconnect: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    });
    const session = await provider.connect();
    expect(session.address).toBe("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");
    expect(session.chainId).toBe("solana-devnet");
    expect(session.connectedAt).toBeGreaterThan(0);
  });

  it("getAddress returns null before connect", () => {
    expect(provider.getAddress()).toBeNull();
  });

  it("getAddress returns address after connect", async () => {
    const pk = mockPublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");
    setWindowSolana({
      connect: vi.fn().mockResolvedValue({ publicKey: pk }),
      disconnect: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    });
    await provider.connect();
    expect(provider.getAddress()).toBe("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");
  });

  it("disconnect clears cached address and calls window.solana.disconnect", async () => {
    const pk = mockPublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");
    const disconnectFn = vi.fn().mockResolvedValue(undefined);
    setWindowSolana({
      connect: vi.fn().mockResolvedValue({ publicKey: pk }),
      disconnect: disconnectFn,
      on: vi.fn(),
      off: vi.fn(),
    });
    await provider.connect();
    expect(provider.getAddress()).toBeTruthy();
    await provider.disconnect();
    expect(provider.getAddress()).toBeNull();
    expect(disconnectFn).toHaveBeenCalledOnce();
  });

  it("listens to Phantom disconnect event", async () => {
    const onFn = vi.fn();
    setWindowSolana({
      connect: vi.fn().mockResolvedValue({
        publicKey: mockPublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"),
      }),
      disconnect: vi.fn(),
      on: onFn,
      off: vi.fn(),
    });
    await provider.connect();
    expect(onFn).toHaveBeenCalledWith("disconnect", expect.any(Function));
  });

  it("disconnect event handler clears address", async () => {
    const handlers: Record<string, (() => void) | undefined> = {};
    const onFn = vi.fn((event: string, handler: () => void) => {
      handlers[event] = handler;
    });
    setWindowSolana({
      connect: vi.fn().mockResolvedValue({
        publicKey: mockPublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"),
      }),
      disconnect: vi.fn(),
      on: onFn,
      off: vi.fn(),
    });
    await provider.connect();
    expect(provider.getAddress()).toBeTruthy();
    handlers["disconnect"]?.();
    expect(provider.getAddress()).toBeNull();
  });

  it("chainFamily is solana", () => {
    expect(provider.chainFamily).toBe("solana");
  });

  it("connect throws WalletError for unknown errors", async () => {
    setWindowSolana({
      connect: vi.fn().mockRejectedValue(new Error("Network error")),
      disconnect: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    });
    await expect(provider.connect()).rejects.toMatchObject({
      name: "WalletError",
      code: "unknown",
    });
  });
});
