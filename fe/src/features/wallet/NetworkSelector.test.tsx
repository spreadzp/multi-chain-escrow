import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useWalletStore } from "./wallet-store";
import { NetworkSelector } from "./NetworkSelector";

describe("NetworkSelector", () => {
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

  it("renders all 4 chain options", () => {
    render(<NetworkSelector />);
    const select = screen.getByRole("combobox", { name: "Select network" });
    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(5);
    expect(screen.getByText("Solana Localnet")).toBeDefined();
    expect(screen.getByText("Solana Devnet")).toBeDefined();
    expect(screen.getByText("Stellar Localnet")).toBeDefined();
    expect(screen.getByText("Stellar Testnet")).toBeDefined();
  });

  it("renders without crash when activeChainId is null", () => {
    render(<NetworkSelector />);
    const select = screen.getByRole("combobox", { name: "Select network" });
    expect((select as HTMLSelectElement).value).toBe("");
  });

  it("shows current activeChainId as selected", () => {
    useWalletStore.setState({ activeChainId: "solana-devnet" });
    render(<NetworkSelector />);
    const select = screen.getByRole("combobox", { name: "Select network" });
    expect((select as HTMLSelectElement).value).toBe("solana-devnet");
  });

  it("calls setChain on change", () => {
    render(<NetworkSelector />);
    const select = screen.getByRole("combobox", { name: "Select network" });
    fireEvent.change(select, { target: { value: "stellar-testnet" } });
    expect(useWalletStore.getState().activeChainId).toBe("stellar-testnet");
    expect(useWalletStore.getState().session).toBeNull();
    expect(useWalletStore.getState().status).toBe("disconnected");
  });

  it("is disabled when status is connecting", () => {
    useWalletStore.setState({ status: "connecting" });
    render(<NetworkSelector />);
    const select = screen.getByRole("combobox", { name: "Select network" });
    expect((select as HTMLSelectElement).disabled).toBe(true);
  });

  it("is enabled when status is disconnected", () => {
    render(<NetworkSelector />);
    const select = screen.getByRole("combobox", { name: "Select network" });
    expect((select as HTMLSelectElement).disabled).toBe(false);
  });
});
