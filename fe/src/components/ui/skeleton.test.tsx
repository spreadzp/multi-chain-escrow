import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Skeleton, EscrowCardSkeleton, EscrowListSkeleton } from "@/components/ui/skeleton";

afterEach(cleanup);

describe("Skeleton", () => {
  it("renders with default className", () => {
    render(<Skeleton />);
    expect(screen.getByTestId("skeleton")).toBeDefined();
  });

  it("renders with custom className", () => {
    render(<Skeleton className="h-8 w-16" />);
    const el = screen.getByTestId("skeleton");
    expect(el.className).toContain("h-8");
    expect(el.className).toContain("w-16");
  });

  it("has animate-pulse class", () => {
    render(<Skeleton />);
    expect(screen.getByTestId("skeleton").className).toContain("animate-pulse");
  });
});

describe("EscrowCardSkeleton", () => {
  it("renders skeleton card with testid", () => {
    render(<EscrowCardSkeleton />);
    expect(screen.getByTestId("escrow-card-skeleton")).toBeDefined();
  });

  it("contains multiple skeleton elements", () => {
    render(<EscrowCardSkeleton />);
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(3);
  });
});

describe("EscrowListSkeleton", () => {
  it("renders list skeleton with testid", () => {
    render(<EscrowListSkeleton />);
    expect(screen.getByTestId("escrow-list-skeleton")).toBeDefined();
  });

  it("renders specified number of card skeletons", () => {
    render(<EscrowListSkeleton count={5} />);
    const cards = screen.getAllByTestId("escrow-card-skeleton");
    expect(cards).toHaveLength(5);
  });

  it("defaults to 3 card skeletons", () => {
    render(<EscrowListSkeleton />);
    const cards = screen.getAllByTestId("escrow-card-skeleton");
    expect(cards).toHaveLength(3);
  });
});
