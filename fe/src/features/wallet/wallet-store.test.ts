import { describe, it, expect, beforeEach } from "vitest";
import { useWalletStore } from "./wallet-store";

describe("walletStore", () => {
  beforeEach(() => {
    useWalletStore.setState({
      activeChainId: null,
      session: null,
      status: "disconnected",
      error: null,
    });
  });

  it("initializes with correct defaults", () => {
    const state = useWalletStore.getState();
    expect(state.activeChainId).toBeNull();
    expect(state.session).toBeNull();
    expect(state.status).toBe("disconnected");
    expect(state.error).toBeNull();
  });

  it("setChain sets activeChainId and resets session/status", () => {
    useWalletStore.getState().setConnected({
      address: "abc",
      chainId: "solana-devnet",
      connectedAt: Date.now(),
    });
    useWalletStore.getState().setChain("solana-local");
    const state = useWalletStore.getState();
    expect(state.activeChainId).toBe("solana-local");
    expect(state.session).toBeNull();
    expect(state.status).toBe("disconnected");
    expect(state.error).toBeNull();
  });

  it("setConnecting sets status to connecting and clears error", () => {
    useWalletStore.getState().setError("boom");
    useWalletStore.getState().setConnecting();
    const state = useWalletStore.getState();
    expect(state.status).toBe("connecting");
    expect(state.error).toBeNull();
  });

  it("setConnected sets session and status", () => {
    const session = {
      address: "0xABC",
      chainId: "solana-local" as const,
      connectedAt: 12345,
    };
    useWalletStore.getState().setConnected(session);
    const state = useWalletStore.getState();
    expect(state.session).toEqual(session);
    expect(state.status).toBe("connected");
    expect(state.error).toBeNull();
  });

  it("setError sets status to error and stores message", () => {
    useWalletStore.getState().setError("something went wrong");
    const state = useWalletStore.getState();
    expect(state.status).toBe("error");
    expect(state.error).toBe("something went wrong");
  });

  it("disconnect clears session and resets status", () => {
    useWalletStore.getState().setConnected({
      address: "abc",
      chainId: "solana-devnet",
      connectedAt: Date.now(),
    });
    useWalletStore.getState().disconnect();
    const state = useWalletStore.getState();
    expect(state.session).toBeNull();
    expect(state.status).toBe("disconnected");
    expect(state.error).toBeNull();
  });

  it("setConnecting does not clear existing session", () => {
    const session = {
      address: "0xDEF",
      chainId: "stellar-testnet" as const,
      connectedAt: 99999,
    };
    useWalletStore.getState().setConnected(session);
    useWalletStore.getState().setConnecting();
    const state = useWalletStore.getState();
    expect(state.session).toEqual(session);
    expect(state.status).toBe("connecting");
  });
});
