import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import HowItWorks from "./page";

vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="reactflow-mock">{children}</div>
  ),
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  Position: { Left: "left", Right: "right", Top: "top", Bottom: "bottom" },
}));

afterEach(() => {
  cleanup();
});

describe("How it works page", () => {
  it("renders the heading", () => {
    render(<HowItWorks />);
    expect(screen.getByRole("heading", { name: /how it works/i })).toBeInTheDocument();
  });

  it("renders roles section with depositor, beneficiary, resolver", () => {
    render(<HowItWorks />);
    expect(screen.getByRole("heading", { name: /roles/i })).toBeInTheDocument();
    expect(screen.getAllByText(/depositor/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/beneficiary/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/resolver/i).length).toBeGreaterThan(0);
  });

  it("renders flow section describing deposit → release/refund", () => {
    render(<HowItWorks />);
    expect(screen.getByRole("heading", { name: /escrow flow/i })).toBeInTheDocument();
    expect(screen.getAllByText(/deposit/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/release/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/refund/i).length).toBeGreaterThan(0);
  });

  it("renders status transitions", () => {
    render(<HowItWorks />);
    expect(screen.getByRole("heading", { name: /status transitions/i })).toBeInTheDocument();
    expect(screen.getAllByText(/created/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/released/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/refunded/i).length).toBeGreaterThan(0);
  });

  it("renders Solana vs Stellar comparison table", () => {
    render(<HowItWorks />);
    expect(screen.getByTestId("comparison-table")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(screen.getAllByText(/solana/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/stellar/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/instruction program/i)).toBeInTheDocument();
    expect(screen.getByText(/invokehostfunction/i)).toBeInTheDocument();
  });

  it("renders mock mode notice", () => {
    render(<HowItWorks />);
    expect(screen.getByText(/no real blockchain/i)).toBeInTheDocument();
  });

  it("renders sequence diagrams section", () => {
    render(<HowItWorks />);
    expect(screen.getByRole("heading", { name: /sequence diagrams/i })).toBeInTheDocument();
    expect(screen.getByTestId("diagram-create-escrow-sequence")).toBeInTheDocument();
    expect(screen.getByTestId("diagram-release-escrow-sequence")).toBeInTheDocument();
    expect(screen.getByTestId("diagram-refund-escrow-sequence")).toBeInTheDocument();
  });

  it("renders architecture component diagram", () => {
    render(<HowItWorks />);
    expect(screen.getByRole("heading", { name: /^architecture$/i })).toBeInTheDocument();
    expect(screen.getByTestId("diagram-component-architecture")).toBeInTheDocument();
  });

  it("renders local to testnet transition block", () => {
    render(<HowItWorks />);
    expect(screen.getByTestId("local-to-testnet")).toBeInTheDocument();
    expect(screen.getByText(/local → testnet/i)).toBeInTheDocument();
  });

  it("renders repo structure map", () => {
    render(<HowItWorks />);
    expect(screen.getByTestId("repo-map")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /repo structure/i })).toBeInTheDocument();
    expect(screen.getByText(/escrow-adapter.ts/i)).toBeInTheDocument();
    expect(screen.getAllByText(/MockEscrowAdapter/i).length).toBeGreaterThan(0);
  });
});
