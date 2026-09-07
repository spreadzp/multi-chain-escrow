import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { CreateEscrowForm } from "./CreateEscrowForm";
import { withProviders } from "@/test-utils";
import { useWalletStore } from "@/features/wallet/wallet-store";
import { useEscrowStore } from "../escrow-store";
import { adapterRegistry } from "../adapter/registry";
import { MockEscrowAdapter } from "../adapter/MockEscrowAdapter";
import { clearStorage } from "../adapter/mock-persist";
import type { ChainId } from "@/shared/types";

const CHAIN_ID: ChainId = "solana-devnet";
const ADDRESS = "0xWallet123";

function mockAdapter() {
  return new MockEscrowAdapter(CHAIN_ID);
}

function renderForm() {
  return render(withProviders(<CreateEscrowForm />));
}

function fillField(label: RegExp, value: string) {
  const input = screen.getByLabelText(label) as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
}

function clickSubmit() {
  fireEvent.click(screen.getByRole("button", { name: /create/i }));
}

describe("CreateEscrowForm", () => {
  beforeEach(() => {
    clearStorage(CHAIN_ID);
    useEscrowStore.getState().clear();
    useWalletStore.setState({
      activeChainId: CHAIN_ID,
      session: { address: ADDRESS, chainId: CHAIN_ID } as never,
      status: "connected",
      error: null,
    });
    adapterRegistry.clear();
    const adapter = mockAdapter();
    adapter.setWalletAddress(ADDRESS);
    adapterRegistry.register(CHAIN_ID, adapter);
  });

  afterEach(() => {
    cleanup();
    clearStorage(CHAIN_ID);
    adapterRegistry.clear();
    useEscrowStore.getState().clear();
    useWalletStore.setState({
      activeChainId: null,
      session: null,
      status: "disconnected",
      error: null,
    });
  });

  it("renders beneficiary, amount, and resolver fields", () => {
    renderForm();
    expect(screen.getByLabelText(/beneficiary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/resolver/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    renderForm();
    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
  });

  it("disables submit when wallet not connected", () => {
    useWalletStore.setState({
      activeChainId: null,
      session: null,
      status: "disconnected",
      error: null,
    });
    renderForm();
    expect(screen.getByRole("button", { name: /create/i })).toBeDisabled();
  });

  it("calls createEscrow with form values on submit", async () => {
    renderForm();

    fillField(/beneficiary/i, "0xBen123");
    fillField(/amount/i, "100");
    clickSubmit();

    await waitFor(() => {
      const store = useEscrowStore.getState();
      const escrows = Object.values(store.byId);
      expect(escrows).toHaveLength(1);
      expect(escrows[0].beneficiary).toBe("0xBen123");
      expect(escrows[0].amount).toBe("100");
    });
  });

  it("disables submit during loading", async () => {
    renderForm();

    fillField(/beneficiary/i, "0xBen123");
    fillField(/amount/i, "100");

    const submitBtn = screen.getByRole("button", { name: /create/i });
    clickSubmit();

    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
    });
  });

  it("shows success message with escrow id and tx hash after submit", async () => {
    renderForm();

    fillField(/beneficiary/i, "0xBen123");
    fillField(/amount/i, "100");
    clickSubmit();

    await waitFor(() => {
      expect(screen.getByText(/escrow id:/i)).toBeInTheDocument();
      expect(screen.getByText(/tx hash:/i)).toBeInTheDocument();
    });
  });

  it("resets form after successful submission", async () => {
    renderForm();

    fillField(/beneficiary/i, "0xBen123");
    fillField(/amount/i, "100");
    clickSubmit();

    await waitFor(() => {
      expect(screen.getByLabelText(/beneficiary/i)).toHaveValue("");
      expect(screen.getByLabelText(/amount/i)).toHaveValue("");
    });
  });

  it("shows error message from store", () => {
    useEscrowStore.setState({ error: "Something went wrong" });
    renderForm();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("clear error button removes error message", async () => {
    useEscrowStore.setState({ error: "Something went wrong" });
    renderForm();

    const clearBtn = screen.getByRole("button", { name: /clear/i });
    fireEvent.click(clearBtn);

    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it("validation prevents empty beneficiary", async () => {
    renderForm();

    fillField(/amount/i, "100");
    clickSubmit();

    expect(screen.getByText(/beneficiary.*required/i)).toBeInTheDocument();
  });

  it("validation prevents non-positive amount", async () => {
    renderForm();

    fillField(/beneficiary/i, "0xBen123");
    fillField(/amount/i, "0");
    clickSubmit();

    expect(screen.getByText(/amount.*positive/i)).toBeInTheDocument();
  });

  it("resolver field is optional", async () => {
    renderForm();

    fillField(/beneficiary/i, "0xBen123");
    fillField(/amount/i, "100");
    clickSubmit();

    await waitFor(() => {
      const store = useEscrowStore.getState();
      const escrows = Object.values(store.byId);
      expect(escrows).toHaveLength(1);
      expect(escrows[0].resolver).toBe("0xBen123");
    });
  });
});
