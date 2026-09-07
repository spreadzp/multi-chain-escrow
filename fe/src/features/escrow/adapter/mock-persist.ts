import type { ChainId, Escrow } from "@/shared/types";

function storageKey(chainId: ChainId): string {
  return `mock-escrows:${chainId}`;
}

export function saveToStorage(chainId: ChainId, escrows: Escrow[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(chainId), JSON.stringify(escrows));
  } catch {
    // Quota exceeded or other storage error — silently ignore
  }
}

export function loadFromStorage(chainId: ChainId): Escrow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(chainId));
    if (!raw) return [];
    return JSON.parse(raw) as Escrow[];
  } catch {
    return [];
  }
}

export function clearStorage(chainId: ChainId): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(chainId));
  } catch {
    // Storage error — silently ignore
  }
}
