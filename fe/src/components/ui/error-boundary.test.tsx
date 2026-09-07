import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ui/error-boundary";

function ThrowOnRender({ error }: { error: Error }): never {
  throw error;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Hello</div>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId("child")).toBeDefined();
  });

  it("catches thrown error and renders fallback UI", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    render(
      <ErrorBoundary>
        <ThrowOnRender error={new Error("Test crash")} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeDefined();
    expect(screen.getByText("Test crash")).toBeDefined();
    consoleSpy.mockRestore();
  });

  it("renders custom fallback when provided", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom</div>}>
        <ThrowOnRender error={new Error("Boom")} />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId("custom-fallback")).toBeDefined();
    consoleSpy.mockRestore();
  });

  it("renders Try again button in default fallback", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    render(
      <ErrorBoundary>
        <ThrowOnRender error={new Error("Crash")} />
      </ErrorBoundary>,
    );
    expect(screen.getAllByText("Try again").length).toBeGreaterThan(0);
    consoleSpy.mockRestore();
  });
});
