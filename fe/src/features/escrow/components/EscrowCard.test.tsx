import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { EscrowCard } from "./EscrowCard";
import { withProviders } from "@/test-utils";
import { useWalletStore } from "@/features/wallet/wallet-store";
import { useEscrowStore } from "../escrow-store";
import { adapterRegistry } from "../adapter/registry";
import { MockEscrowAdapter } from "../adapter/MockEscrowAdapter";
import { clearStorage } from "../adapter/mock-persist";
import type { Escrow, ChainId } from "@/shared/types";

const CHAIN_ID: ChainId = "solana-devnet";
const DEPOSITOR = "0xDep1234567890";
const BENEFICIARY = "0xBen1234567890";
const RESOLVER = "0xRes1234567890";

function makeEscrow(overrides: Partial<Escrow> = {}): Escrow {
  return {
    id: "esc1",
    chainId: CHAIN_ID,
    depositor: DEPOSITOR,
    beneficiary: BENEFICIARY,
    resolver: RESOLVER,
    amount: "100",
    amountRaw: "100",
    tokenAddress: "",
    status: "created",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    txHashDeposit: "tx_deposit",
    ...overrides,
  };
}

function setupWallet(address: string) {
  useWalletStore.setState({
    activeChainId: CHAIN_ID,
    session: { address, chainId: CHAIN_ID } as never,
    status: "connected",
    error: null,
  });
}

function setupAdapter() {
  adapterRegistry.clear();
  const adapter = new MockEscrowAdapter(CHAIN_ID);
  adapter.setWalletAddress(BENEFICIARY);
  adapterRegistry.register(CHAIN_ID, adapter);
}

describe("EscrowCard", () => {
  beforeEach(() => {
    clearStorage(CHAIN_ID);
    useEscrowStore.getState().clear();
    setupAdapter();
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

  it("shows escrow id (shortened)", () => {
    setupWallet(BENEFICIARY);
    const escrow = makeEscrow({ id: "escrow-abc-12345" });
    render(withProviders(<EscrowCard escrow={escrow} />));
    expect(screen.getByText(/escr.*2345/i)).toBeInTheDocument();
  });

  it("shows status badge with created (blue)", () => {
    setupWallet(BENEFICIARY);
    render(withProviders(<EscrowCard escrow={makeEscrow()} />));
    const badge = screen.getByText(/created/i);
    expect(badge).toBeInTheDocument();
  });

  it("shows status badge with released (green)", () => {
    setupWallet(BENEFICIARY);
    render(withProviders(<EscrowCard escrow={makeEscrow({ status: "released" })} />));
    const badge = screen.getByText(/released/i);
    expect(badge).toBeInTheDocument();
  });

  it("shows status badge with refunded (gray)", () => {
    setupWallet(BENEFICIARY);
    render(withProviders(<EscrowCard escrow={makeEscrow({ status: "refunded" })} />));
    const badge = screen.getByText(/refunded/i);
    expect(badge).toBeInTheDocument();
  });

  it("shows amount", () => {
    setupWallet(BENEFICIARY);
    render(withProviders(<EscrowCard escrow={makeEscrow({ amount: "250" })} />));
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it("shows shortened depositor address", () => {
    setupWallet(BENEFICIARY);
    render(withProviders(<EscrowCard escrow={makeEscrow()} />));
    expect(screen.getByText(/0xDe/i)).toBeInTheDocument();
  });

  it("shows shortened beneficiary address", () => {
    setupWallet(BENEFICIARY);
    render(withProviders(<EscrowCard escrow={makeEscrow()} />));
    expect(screen.getByText(/0xBe/i)).toBeInTheDocument();
  });

  it("shows shortened resolver address", () => {
    setupWallet(BENEFICIARY);
    render(withProviders(<EscrowCard escrow={makeEscrow()} />));
    expect(screen.getByText(/0xRe/i)).toBeInTheDocument();
  });

  it("shows Release button when wallet is beneficiary and status is created", () => {
    setupWallet(BENEFICIARY);
    render(withProviders(<EscrowCard escrow={makeEscrow()} />));
    expect(screen.getByRole("button", { name: /release/i })).toBeInTheDocument();
  });

  it("shows Release button when wallet is resolver and status is created", () => {
    setupWallet(RESOLVER);
    render(withProviders(<EscrowCard escrow={makeEscrow()} />));
    expect(screen.getByRole("button", { name: /release/i })).toBeInTheDocument();
  });

  it("hides Release button when wallet is depositor (not beneficiary/resolver)", () => {
    setupWallet(DEPOSITOR);
    render(withProviders(<EscrowCard escrow={makeEscrow()} />));
    expect(screen.queryByRole("button", { name: /release/i })).not.toBeInTheDocument();
  });

  it("hides Release button when status is released", () => {
    setupWallet(BENEFICIARY);
    render(withProviders(<EscrowCard escrow={makeEscrow({ status: "released" })} />));
    expect(screen.queryByRole("button", { name: /release/i })).not.toBeInTheDocument();
  });

  it("shows Refund button when wallet is depositor and status is created", () => {
    setupWallet(DEPOSITOR);
    render(withProviders(<EscrowCard escrow={makeEscrow()} />));
    expect(screen.getByRole("button", { name: /refund/i })).toBeInTheDocument();
  });

  it("hides Refund button when wallet is beneficiary (not depositor)", () => {
    setupWallet(BENEFICIARY);
    render(withProviders(<EscrowCard escrow={makeEscrow()} />));
    expect(screen.queryByRole("button", { name: /refund/i })).not.toBeInTheDocument();
  });

  it("hides Refund button when status is released", () => {
    setupWallet(DEPOSITOR);
    render(withProviders(<EscrowCard escrow={makeEscrow({ status: "released" })} />));
    expect(screen.queryByRole("button", { name: /refund/i })).not.toBeInTheDocument();
  });

  it("calls releaseEscrow when Release button clicked", async () => {
    setupWallet(BENEFICIARY);
    const adapter = adapterRegistry.getAdapter(CHAIN_ID)!;
    await adapter.createEscrow({
      beneficiary: BENEFICIARY,
      amount: "100",
      resolver: RESOLVER,
    });
    const escrows = await adapter.listEscrowsByUser(BENEFICIARY);
    const escrow = escrows[0];
    useEscrowStore.getState().upsertEscrow(escrow);

    render(withProviders(<EscrowCard escrow={escrow} />));
    fireEvent.click(screen.getByRole("button", { name: /release/i }));

    await waitFor(() => {
      const store = useEscrowStore.getState();
      const updated = store.byId[`${CHAIN_ID}:${escrow.id}`];
      expect(updated?.status).toBe("released");
    });
  });

  it("calls refundEscrow when Refund button clicked", async () => {
    setupWallet(DEPOSITOR);
    const adapter = adapterRegistry.getAdapter(CHAIN_ID)!;
    adapter.setWalletAddress(DEPOSITOR);
    await adapter.createEscrow({
      beneficiary: BENEFICIARY,
      amount: "100",
      resolver: RESOLVER,
    });
    const escrows = await adapter.listEscrowsByUser(DEPOSITOR);
    const escrow = escrows[0];
    useEscrowStore.getState().upsertEscrow(escrow);

    render(withProviders(<EscrowCard escrow={escrow} />));
    fireEvent.click(screen.getByRole("button", { name: /refund/i }));

    await waitFor(() => {
      const store = useEscrowStore.getState();
      const updated = store.byId[`${CHAIN_ID}:${escrow.id}`];
      expect(updated?.status).toBe("refunded");
    });
  });

  it("shows loading state on buttons during action", async () => {
    setupWallet(BENEFICIARY);
    const adapter = adapterRegistry.getAdapter(CHAIN_ID)!;
    await adapter.createEscrow({
      beneficiary: BENEFICIARY,
      amount: "100",
      resolver: RESOLVER,
    });
    const escrows = await adapter.listEscrowsByUser(BENEFICIARY);
    const escrow = escrows[0];
    useEscrowStore.getState().upsertEscrow(escrow);

    render(withProviders(<EscrowCard escrow={escrow} />));
    const releaseBtn = screen.getByRole("button", { name: /release/i });
    fireEvent.click(releaseBtn);

    await waitFor(() => {
      expect(releaseBtn).toBeDisabled();
    });
  });
});
