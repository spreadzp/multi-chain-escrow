import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { saveToStorage, loadFromStorage, clearStorage } from "./mock-persist";
import type { Escrow, ChainId } from "@/shared/types";

const CHAIN_ID: ChainId = "solana-devnet";
const STORAGE_KEY = `mock-escrows:${CHAIN_ID}`;

function makeEscrow(overrides: Partial<Escrow> = {}): Escrow {
  return {
    id: "mock-esc-1",
    chainId: CHAIN_ID,
    depositor: "0xDep",
    beneficiary: "0xBen",
    resolver: "0xRes",
    amount: "100",
    amountRaw: "100",
    tokenAddress: "",
    status: "created",
    createdAt: 1000,
    updatedAt: 1000,
    txHashDeposit: "mock-tx-1",
    ...overrides,
  };
}

describe("mock-persist", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("saveToStorage", () => {
    it("writes escrows to localStorage under mock-escrows:chainId", () => {
      const escrows = [makeEscrow()];
      saveToStorage(CHAIN_ID, escrows);

      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe("mock-esc-1");
    });

    it("overwrites previous data on subsequent saves", () => {
      saveToStorage(CHAIN_ID, [makeEscrow({ id: "esc-1" })]);
      saveToStorage(CHAIN_ID, [makeEscrow({ id: "esc-2" })]);

      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(raw!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe("esc-2");
    });
  });

  describe("loadFromStorage", () => {
    it("returns escrows from localStorage", () => {
      const escrows = [makeEscrow(), makeEscrow({ id: "mock-esc-2" })];
      saveToStorage(CHAIN_ID, escrows);

      const loaded = loadFromStorage(CHAIN_ID);
      expect(loaded).toHaveLength(2);
      expect(loaded[0].id).toBe("mock-esc-1");
      expect(loaded[1].id).toBe("mock-esc-2");
    });

    it("returns [] when key doesn't exist", () => {
      const loaded = loadFromStorage(CHAIN_ID);
      expect(loaded).toEqual([]);
    });

    it("returns [] on parse error (corrupted data)", () => {
      localStorage.setItem(STORAGE_KEY, "{invalid json}");

      const loaded = loadFromStorage(CHAIN_ID);
      expect(loaded).toEqual([]);
    });

    it("returns [] when localStorage is unavailable (SSR)", () => {
      vi.unstubAllGlobals();
      // localStorage doesn't exist in Node without stub

      const loaded = loadFromStorage(CHAIN_ID);
      expect(loaded).toEqual([]);
    });
  });

  describe("clearStorage", () => {
    it("removes the key from localStorage", () => {
      saveToStorage(CHAIN_ID, [makeEscrow()]);
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

      clearStorage(CHAIN_ID);

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("does not throw when key doesn't exist", () => {
      expect(() => clearStorage(CHAIN_ID)).not.toThrow();
    });

    it("does not throw when localStorage is unavailable (SSR)", () => {
      vi.unstubAllGlobals();
      expect(() => clearStorage(CHAIN_ID)).not.toThrow();
    });
  });

  describe("saveToStorage SSR guard", () => {
    it("does not throw when localStorage is unavailable", () => {
      vi.unstubAllGlobals();
      expect(() => saveToStorage(CHAIN_ID, [makeEscrow()])).not.toThrow();
    });
  });
});
