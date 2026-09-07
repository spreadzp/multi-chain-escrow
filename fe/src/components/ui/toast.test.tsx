import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { ToastProvider, useToast } from "@/components/ui/toast";

function TestConsumer() {
  const { addToast } = useToast();
  return (
    <div>
      <button data-testid="btn-success" onClick={() => addToast({ type: "success", title: "Success!", message: "TX confirmed" })}>
        Show Success
      </button>
      <button data-testid="btn-error" onClick={() => addToast({ type: "error", title: "Failed!", message: "Simulation error" })}>
        Show Error
      </button>
      <button data-testid="btn-info" onClick={() => addToast({ type: "info", title: "Info", message: "Syncing..." })}>
        Show Info
      </button>
      <button data-testid="btn-quick" onClick={() => addToast({ type: "success", title: "Quick!", duration: 500 })}>
        Show Quick
      </button>
    </div>
  );
}

describe("Toast", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders provider without toasts initially", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    expect(screen.getByTestId("toast-container")).toBeDefined();
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
  });

  it("shows success toast when addToast is called", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("btn-success"));
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("Success!")).toBeDefined();
    expect(screen.getByText("TX confirmed")).toBeDefined();
  });

  it("shows error toast when addToast is called", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("btn-error"));
    expect(screen.getByText("Failed!")).toBeDefined();
    expect(screen.getByText("Simulation error")).toBeDefined();
  });

  it("shows info toast when addToast is called", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("btn-info"));
    expect(screen.getByText("Info")).toBeDefined();
  });

  it("removes toast after duration", async () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("btn-quick"));
    expect(screen.getByText("Quick!")).toBeDefined();

    await waitFor(
      () => {
        expect(screen.queryByText("Quick!")).toBeNull();
      },
      { timeout: 3000 },
    );
  });

  it("removes toast when dismiss button clicked", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("btn-success"));
    expect(screen.getByText("Success!")).toBeDefined();

    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(screen.queryByText("Success!")).toBeNull();
  });

  it("throws when useToast is used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    expect(() => render(<TestConsumer />)).toThrow("useToast must be used within ToastProvider");
    consoleSpy.mockRestore();
  });
});
