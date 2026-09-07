import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Home from "./page";
import { useEscrowStore } from "@/features/escrow/escrow-store";
import { useWalletStore } from "@/features/wallet/wallet-store";

// Mock hooks that have side effects on mount
vi.mock("@/features/escrow/hooks/useEscrowEvents", () => ({
  useEscrowEvents: () => ({ subscribed: true }),
}));
vi.mock("@/features/escrow/hooks/useAddressSync", () => ({
  useAddressSync: () => { },
}));
vi.mock("@/features/escrow/hooks/useEscrowAdapter", () => ({
  useEscrowAdapter: () => null,
}));

beforeEach(() => {
  useEscrowStore.getState().clear();
  useWalletStore.setState({
    activeChainId: "solana-devnet",
    session: null,
    status: "disconnected",
    error: null,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Home page", () => {
  it("renders without crashing when wallet not connected", () => {
    render(<Home />);
    expect(screen.getByText(/multi-chain escrow/i)).toBeInTheDocument();
  });

  it("renders WalletBar", () => {
    render(<Home />);
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });

  it("renders CreateEscrowForm heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /create escrow/i })).toBeInTheDocument();
  });

  it("renders EscrowList empty state", () => {
    render(<Home />);
    expect(screen.getByText(/no escrows yet/i)).toBeInTheDocument();
  });

  it("renders ActivityFeed empty state", () => {
    render(<Home />);
    expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
  });

  it("shows error banner when store has error", () => {
    useEscrowStore.getState().setError("Something went wrong");
    render(<Home />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("shows loading indicator when loading and no escrows", () => {
    useEscrowStore.getState().setLoading(true);
    render(<Home />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
