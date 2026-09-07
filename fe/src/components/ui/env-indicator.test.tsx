import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { useWalletStore } from "@/features/wallet/wallet-store";

vi.mock("@/config/env", () => ({
  env: { isMockMode: false },
}));

import { EnvIndicator } from "@/components/ui/env-indicator";

afterEach(cleanup);

describe("EnvIndicator", () => {
  beforeEach(() => {
    useWalletStore.setState({
      activeChainId: null,
      session: null,
      status: "disconnected",
      error: null,
    });
  });

  it("renders with testid", () => {
    render(<EnvIndicator />);
    expect(screen.getByTestId("env-indicator")).toBeDefined();
  });

  it("shows Not connected when no chain and not mock mode", () => {
    render(<EnvIndicator />);
    expect(screen.getByTestId("env-indicator").textContent).toBe("Not connected");
  });

  it("shows chain name for stellar-testnet", () => {
    useWalletStore.setState({
      activeChainId: "stellar-testnet",
      session: null,
      status: "disconnected",
      error: null,
    });
    render(<EnvIndicator />);
    const el = screen.getByTestId("env-indicator");
    expect(el.textContent).toBe("Stellar Testnet");
    expect(el.getAttribute("data-env")).toBe("testnet");
  });

  it("shows chain name for solana-devnet", () => {
    useWalletStore.setState({
      activeChainId: "solana-devnet",
      session: null,
      status: "disconnected",
      error: null,
    });
    render(<EnvIndicator />);
    const el = screen.getByTestId("env-indicator");
    expect(el.textContent).toBe("Solana Devnet");
    expect(el.getAttribute("data-env")).toBe("devnet");
  });

  it("shows local env type for solana-local", () => {
    useWalletStore.setState({
      activeChainId: "solana-local",
      session: null,
      status: "disconnected",
      error: null,
    });
    render(<EnvIndicator />);
    const el = screen.getByTestId("env-indicator");
    expect(el.getAttribute("data-env")).toBe("local");
    expect(el.textContent).toBe("Solana Localnet");
  });

  it("shows stellar-local with local env type", () => {
    useWalletStore.setState({
      activeChainId: "stellar-local",
      session: null,
      status: "disconnected",
      error: null,
    });
    render(<EnvIndicator />);
    const el = screen.getByTestId("env-indicator");
    expect(el.getAttribute("data-env")).toBe("local");
    expect(el.textContent).toBe("Stellar Localnet");
  });

  it("updates when chain switches", () => {
    useWalletStore.setState({
      activeChainId: "solana-local",
      session: null,
      status: "disconnected",
      error: null,
    });
    const { rerender } = render(<EnvIndicator />);
    expect(screen.getByTestId("env-indicator").textContent).toBe("Solana Localnet");

    useWalletStore.setState({
      activeChainId: "stellar-testnet",
      session: null,
      status: "disconnected",
      error: null,
    });
    rerender(<EnvIndicator />);
    expect(screen.getByTestId("env-indicator").textContent).toBe("Stellar Testnet");
  });
});
