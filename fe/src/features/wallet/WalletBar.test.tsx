import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useWalletStore } from "./wallet-store";
import { WalletBar } from "./WalletBar";
import { shortenAddress } from "./utils";

describe("shortenAddress", () => {
  it("truncates long address to First4...Last4", () => {
    expect(shortenAddress("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM")).toBe("9WzD...AWWM");
  });

  it("returns short address as-is", () => {
    expect(shortenAddress("Short")).toBe("Short");
  });

  it("supports custom chars", () => {
    expect(shortenAddress("GABCDEFGHIJKLMNOPQRSTUVWXYZ234567", 6)).toBe("GABCDE...234567");
  });
});

describe("WalletBar", () => {
  beforeEach(() => {
    useWalletStore.setState({
      activeChainId: null,
      session: null,
      status: "disconnected",
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders NetworkSelector and Connect button", () => {
    render(<WalletBar />);
    expect(screen.getByRole("combobox", { name: "Select network" })).toBeDefined();
    expect(screen.getByRole("button", { name: /connect/i })).toBeDefined();
  });

  it("Connect button disabled when activeChainId is null", () => {
    render(<WalletBar />);
    const connectBtn = screen.getByRole("button", { name: /connect/i });
    expect(connectBtn).toBeDisabled();
  });

  it("Connect button enabled when activeChainId is set", () => {
    useWalletStore.setState({ activeChainId: "solana-devnet" });
    render(<WalletBar />);
    const connectBtn = screen.getByRole("button", { name: /connect/i });
    expect(connectBtn).not.toBeDisabled();
  });

  it("shows truncated address when connected", () => {
    useWalletStore.setState({
      activeChainId: "solana-devnet",
      session: {
        address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
        chainId: "solana-devnet",
        connectedAt: Date.now(),
      },
      status: "connected",
    });
    render(<WalletBar />);
    expect(screen.getByText("9WzD...AWWM")).toBeDefined();
  });

  it("shows Disconnect button when connected", () => {
    useWalletStore.setState({
      activeChainId: "solana-devnet",
      session: {
        address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
        chainId: "solana-devnet",
        connectedAt: Date.now(),
      },
      status: "connected",
    });
    render(<WalletBar />);
    expect(screen.getByRole("button", { name: /disconnect/i })).toBeDefined();
  });

  it("calls store.disconnect on Disconnect click", () => {
    useWalletStore.setState({
      activeChainId: "solana-devnet",
      session: {
        address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
        chainId: "solana-devnet",
        connectedAt: Date.now(),
      },
      status: "connected",
    });
    render(<WalletBar />);
    fireEvent.click(screen.getByRole("button", { name: /disconnect/i }));
    expect(useWalletStore.getState().status).toBe("disconnected");
    expect(useWalletStore.getState().session).toBeNull();
  });

  it("shows error message when status is error", () => {
    useWalletStore.setState({
      activeChainId: "solana-devnet",
      status: "error",
      error: "Connection failed",
    });
    render(<WalletBar />);
    expect(screen.getByText("Connection failed")).toBeDefined();
  });

  it("does not show error message when status is not error", () => {
    useWalletStore.setState({
      activeChainId: "solana-devnet",
      status: "disconnected",
      error: null,
    });
    render(<WalletBar />);
    expect(screen.queryByText("Connection failed")).toBeNull();
  });

  it("shows status badge with correct text for disconnected", () => {
    render(<WalletBar />);
    expect(screen.getByText(/disconnected/i)).toBeDefined();
  });

  it("shows status badge with correct text for connecting", () => {
    useWalletStore.setState({ activeChainId: "solana-devnet", status: "connecting" });
    render(<WalletBar />);
    expect(screen.getByText(/connecting/i)).toBeDefined();
  });

  it("shows status badge with correct text for connected", () => {
    useWalletStore.setState({
      activeChainId: "solana-devnet",
      status: "connected",
      session: {
        address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
        chainId: "solana-devnet",
        connectedAt: Date.now(),
      },
    });
    render(<WalletBar />);
    expect(screen.getByText(/connected/i)).toBeDefined();
  });

  it("shows Mock badge when using mock provider", async () => {
    useWalletStore.setState({ activeChainId: "solana-devnet" });
    render(<WalletBar />);
    fireEvent.click(screen.getByRole("button", { name: /connect/i }));
    await vi.waitFor(() => {
      expect(useWalletStore.getState().status).toBe("connected");
    });
    expect(screen.getByText("Mock")).toBeDefined();
  });

  it("renders without crash in all 4 statuses", () => {
    const statuses = ["disconnected", "connecting", "connected", "error"] as const;
    for (const status of statuses) {
      useWalletStore.setState({
        activeChainId: "solana-devnet",
        status,
        session: status === "connected" ? {
          address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
          chainId: "solana-devnet",
          connectedAt: Date.now(),
        } : null,
        error: status === "error" ? "Some error" : null,
      });
      const { unmount } = render(<WalletBar />);
      unmount();
    }
  });
});
