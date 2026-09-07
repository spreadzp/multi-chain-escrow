// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isTransientError,
  isNetworkError,
  userErrorMessage,
  withRetry,
  withErrorHandling,
  MAX_RETRIES,
  BASE_BACKOFF_MS,
} from "../error-handling";
import { useEscrowStore } from "@/features/escrow/escrow-store";

describe("isTransientError", () => {
  it("returns true for timeout errors", () => {
    expect(isTransientError(new Error("Request timeout"))).toBe(true);
    expect(isTransientError(new Error("Operation timed out"))).toBe(true);
  });

  it("returns true for network errors", () => {
    expect(isTransientError(new Error("network error"))).toBe(true);
    expect(isTransientError(new Error("fetch failed"))).toBe(true);
    expect(isTransientError(new Error("ECONNRESET"))).toBe(true);
  });

  it("returns true for server errors", () => {
    expect(isTransientError(new Error("503 Service Unavailable"))).toBe(true);
    expect(isTransientError(new Error("502 Bad Gateway"))).toBe(true);
    expect(isTransientError(new Error("429 Too Many Requests"))).toBe(true);
  });

  it("returns false for non-transient errors", () => {
    expect(isTransientError(new Error("Invalid argument"))).toBe(false);
    expect(isTransientError(new Error("Not found"))).toBe(false);
  });
});

describe("isNetworkError", () => {
  it("returns true for network-related errors", () => {
    expect(isNetworkError(new Error("network error"))).toBe(true);
    expect(isNetworkError(new Error("fetch failed"))).toBe(true);
    expect(isNetworkError(new Error("ECONNREFUSED"))).toBe(true);
    expect(isNetworkError(new Error("connection refused"))).toBe(true);
  });

  it("returns false for non-network errors", () => {
    expect(isNetworkError(new Error("timeout"))).toBe(false);
    expect(isNetworkError(new Error("Invalid argument"))).toBe(false);
  });
});

describe("userErrorMessage", () => {
  it("returns user-friendly message for network errors", () => {
    const msg = userErrorMessage(new Error("network error"));
    expect(msg).toContain("Сеть недоступна");
  });

  it("returns timeout message for timeout errors", () => {
    const msg = userErrorMessage(new Error("Request timeout"));
    expect(msg).toContain("Таймаут");
  });

  it("returns original message for other errors", () => {
    const msg = userErrorMessage(new Error("Invalid argument"));
    expect(msg).toBe("Invalid argument");
  });
});

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("succeeds on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on transient error and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce("ok");

    const promise = withRetry(fn, 3, 100);
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries up to max retries then throws", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("timeout"));

    const promise = withRetry(fn, 2, 100);
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);
    await expect(promise).rejects.toThrow("timeout");
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("does not retry on non-transient errors", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Invalid argument"));

    await expect(withRetry(fn)).rejects.toThrow("Invalid argument");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("uses exponential backoff", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce("ok");

    const promise = withRetry(fn, 3, 100);

    // First retry at 100ms (100 * 2^0)
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(2);

    // Second retry at 200ms (100 * 2^1)
    await vi.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(3);

    const result = await promise;
    expect(result).toBe("ok");
  });

  it("respects MAX_RETRIES constant", () => {
    expect(MAX_RETRIES).toBe(3);
  });

  it("respects BASE_BACKOFF_MS constant", () => {
    expect(BASE_BACKOFF_MS).toBe(500);
  });
});

describe("withErrorHandling", () => {
  beforeEach(() => {
    useEscrowStore.getState().clear();
  });

  it("returns result on success and clears error", async () => {
    const fn = vi.fn().mockResolvedValue("data");
    const result = await withErrorHandling(fn, "test");
    expect(result).toBe("data");
    expect(useEscrowStore.getState().error).toBeNull();
  });

  it("returns null and sets store error on failure", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("network error"));
    const result = await withErrorHandling(fn, "test");
    expect(result).toBeNull();
    expect(useEscrowStore.getState().error).toContain("Сеть недоступна");
  });

  it("returns null for non-transient errors without retry", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Not found"));
    const result = await withErrorHandling(fn, "test");
    expect(result).toBeNull();
    expect(useEscrowStore.getState().error).toBe("Not found");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
