import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { EscrowList } from "./EscrowList";
import { withProviders } from "@/test-utils";
import { useWalletStore } from "@/features/wallet/wallet-store";
import { useEscrowStore, escrowKey } from "../escrow-store";
import { adapterRegistry } from "../adapter/registry";
import { MockEscrowAdapter } from "../adapter/MockEscrowAdapter";
import { clearStorage } from "../adapter/mock-persist";
import type { Escrow, ChainId } from "@/shared/types";

const CHAIN_ID: ChainId = "solana-devnet";
const ADDRESS = "0xWallet123";

function makeEscrow(id: string, createdAt: number, overrides: Partial<Escrow> = {}): Escrow {
  return {
    id,
    chainId: CHAIN_ID,
    depositor: ADDRESS,
    beneficiary: "0xBen123",
    resolver: "0xRes123",
    amount: "100",
    amountRaw: "100",
    tokenAddress: "",
    status: "created",
    createdAt,
    updatedAt: createdAt,
    txHashDeposit: "tx_deposit",
    ...overrides,
  };
}

describe("EscrowList", () => {
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
    const adapter = new MockEscrowAdapter(CHAIN_ID);
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

  it("shows empty state message when no escrows", () => {
    render(withProviders(<EscrowList />));
    expect(screen.getByText(/no escrows/i)).toBeInTheDocument();
  });

  it("renders all escrows from store", () => {
    const now = Date.now();
    const esc1 = makeEscrow("esc1", now - 1000);
    const esc2 = makeEscrow("esc2", now);
    useEscrowStore.getState().upsertEscrow(esc1);
    useEscrowStore.getState().upsertEscrow(esc2);

    render(withProviders(<EscrowList />));
    expect(screen.getByText(/esc1/i)).toBeInTheDocument();
    expect(screen.getByText(/esc2/i)).toBeInTheDocument();
  });

  it("sorts escrows by createdAt desc (newest first)", () => {
    const now = Date.now();
    const old = makeEscrow("old-esc", now - 5000);
    const newer = makeEscrow("new-esc", now);
    useEscrowStore.getState().upsertEscrow(old);
    useEscrowStore.getState().upsertEscrow(newer);

    const { container } = render(withProviders(<EscrowList />));
    const cards = container.querySelectorAll("[data-testid='escrow-card']");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("new-esc");
    expect(cards[1]).toHaveTextContent("old-esc");
  });
});
