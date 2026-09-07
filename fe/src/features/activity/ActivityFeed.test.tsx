import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ActivityFeed } from "./ActivityFeed";
import { useEscrowStore } from "@/features/escrow/escrow-store";
import type { EscrowEvent, ChainId } from "@/shared/types";

const CHAIN_ID: ChainId = "solana-devnet";

function makeEvent(overrides: Partial<EscrowEvent> = {}): EscrowEvent {
  return {
    id: "evt1",
    chainId: CHAIN_ID,
    type: "Deposited",
    escrowId: "escrow-abc1234567890",
    txHash: "0xtxhash1234567890abcdef",
    blockOrLedger: "12345",
    timestamp: Date.now(),
    payload: {},
    ...overrides,
  };
}

beforeEach(() => {
  useEscrowStore.getState().clear();
});

afterEach(() => {
  cleanup();
});

describe("ActivityFeed", () => {
  it("shows empty state when no events", () => {
    render(<ActivityFeed />);
    expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
  });

  it("renders a single event", () => {
    const evt = makeEvent({ type: "Deposited" });
    useEscrowStore.getState().addEvent(evt);

    render(<ActivityFeed />);
    expect(screen.getByText(/deposited/i)).toBeInTheDocument();
    expect(screen.getByText(/solana-devnet/i)).toBeInTheDocument();
  });

  it("renders multiple events in reverse chronological order", () => {
    const older = makeEvent({
      id: "evt-old",
      type: "Deposited",
      timestamp: 1000,
      escrowId: "escrow-old1234567890",
    });
    const newer = makeEvent({
      id: "evt-new",
      type: "Released",
      timestamp: 2000,
      escrowId: "escrow-new1234567890",
    });
    useEscrowStore.getState().addEvent(older);
    useEscrowStore.getState().addEvent(newer);

    render(<ActivityFeed />);
    const items = screen.getAllByTestId("activity-event");
    expect(items).toHaveLength(2);
    // Newer event (Released) should appear first
    expect(items[0]).toHaveTextContent(/released/i);
    expect(items[1]).toHaveTextContent(/deposited/i);
  });

  it("shows type badge with correct text", () => {
    useEscrowStore.getState().addEvent(makeEvent({ type: "Released" }));
    render(<ActivityFeed />);
    expect(screen.getByText(/released/i)).toBeInTheDocument();
  });

  it("shows Refunded badge", () => {
    useEscrowStore.getState().addEvent(makeEvent({ type: "Refunded" }));
    render(<ActivityFeed />);
    expect(screen.getByText(/refunded/i)).toBeInTheDocument();
  });

  it("shows chain label", () => {
    useEscrowStore.getState().addEvent(makeEvent({ chainId: "solana-devnet" }));
    render(<ActivityFeed />);
    expect(screen.getByText(/solana-devnet/i)).toBeInTheDocument();
  });

  it("shows shortened escrow id", () => {
    useEscrowStore.getState().addEvent(
      makeEvent({ escrowId: "escrow-abc1234567890" }),
    );
    render(<ActivityFeed />);
    // shortenAddress with chars=4: "escr...7890"
    expect(screen.getByText(/escr.*7890/i)).toBeInTheDocument();
  });

  it("shows shortened tx hash", () => {
    useEscrowStore.getState().addEvent(
      makeEvent({ txHash: "0xtxhash1234567890abcdef" }),
    );
    render(<ActivityFeed />);
    // shortenAddress with chars=4: "0xtx...cdef"
    expect(screen.getByText(/0xtx.*cdef/i)).toBeInTheDocument();
  });

  it("caps display at 50 events", () => {
    for (let i = 0; i < 60; i++) {
      useEscrowStore.getState().addEvent(
        makeEvent({
          id: `evt-${i}`,
          timestamp: i,
          escrowId: `escrow-${i}1234567890abcd`,
        }),
      );
    }
    render(<ActivityFeed />);
    const items = screen.getAllByTestId("activity-event");
    expect(items).toHaveLength(50);
  });
});
