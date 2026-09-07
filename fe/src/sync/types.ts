import type { ChainId, EscrowAdapter, Escrow } from "@/shared/types";

export type SyncStatus = "idle" | "polling" | "error";

export interface SyncState {
  chainId: ChainId;
  address: string;
  status: SyncStatus;
  lastPollAt: number | null;
  error: string | null;
}

export interface SyncManagerOptions {
  pollIntervalMs?: number;
}

export const DEFAULT_POLL_INTERVAL_MS = 5000;
