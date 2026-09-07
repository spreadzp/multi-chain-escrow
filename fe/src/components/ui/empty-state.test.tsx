import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { EmptyState } from "@/components/ui/empty-state";

afterEach(cleanup);

describe("EmptyState", () => {
  it("renders with title", () => {
    render(<EmptyState title="No data" />);
    expect(screen.getByTestId("empty-state")).toBeDefined();
    expect(screen.getByText("No data")).toBeDefined();
  });

  it("renders with description when provided", () => {
    render(<EmptyState title="No escrows" description="Create one to get started" />);
    expect(screen.getByText("No escrows")).toBeDefined();
    expect(screen.getByText("Create one to get started")).toBeDefined();
  });

  it("does not render description when not provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByText("Empty")).toBeDefined();
    expect(screen.queryByText("Create one to get started")).toBeNull();
  });

  it("renders icon when provided", () => {
    render(<EmptyState title="Empty" icon="📋" />);
    expect(screen.getByText("📋")).toBeDefined();
  });

  it("renders action when provided", () => {
    render(
      <EmptyState
        title="No wallet"
        action={<button data-testid="action-btn">Connect</button>}
      />,
    );
    expect(screen.getByTestId("action-btn")).toBeDefined();
  });

  it("has dashed border style", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByTestId("empty-state").className).toContain("border-dashed");
  });
});
