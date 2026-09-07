import type { ChainId, EscrowAdapter, Escrow } from "@/shared/types";
import { useEscrowStore } from "@/features/escrow/escrow-store";
import {
  type SyncState,
  type SyncManagerOptions,
  DEFAULT_POLL_INTERVAL_MS,
} from "./types";
import { withRetry, userErrorMessage } from "./error-handling";
import { applyEscrowsToStore } from "./store-integration";

type OnPollCallback = (escrows: Escrow[]) => void;

export class SyncManager {
  private static instance: SyncManager | null = null;

  private adapter: EscrowAdapter | null = null;
  private address: string | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private pollIntervalMs: number;
  private state: SyncState | null = null;
  private onPoll: OnPollCallback | null = null;

  private constructor(options?: SyncManagerOptions) {
    this.pollIntervalMs = options?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  }

  static getInstance(options?: SyncManagerOptions): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager(options);
    }
    return SyncManager.instance;
  }

  start(adapter: EscrowAdapter, address: string, onPoll?: OnPollCallback): void {
    this.stop();
    this.adapter = adapter;
    this.address = address;
    this.onPoll = onPoll ?? null;
    this.state = {
      chainId: adapter.chainId,
      address,
      status: "polling",
      lastPollAt: null,
      error: null,
    };

    // Immediately poll once
    this.poll();

    this.intervalId = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.adapter = null;
    this.address = null;
    this.onPoll = null;
    this.state = null;
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }

  getState(): SyncState | null {
    return this.state;
  }

  private async poll(): Promise<void> {
    if (!this.adapter || !this.address) return;

    const store = useEscrowStore.getState();
    store.setLoading(true);

    try {
      const escrows = await withRetry(() => {
        if (!this.adapter || !this.address) return Promise.resolve([] as Escrow[]);
        return this.adapter.listEscrowsByUser(this.address);
      });

      // Guard: stop may have been called during retry
      if (!this.adapter) return;

      // Update store (preserves other chains' escrows)
      applyEscrowsToStore(escrows, this.adapter.chainId);
      store.setError(null);

      // Update internal state
      if (this.state) {
        this.state.status = "polling";
        this.state.lastPollAt = Date.now();
        this.state.error = null;
      }

      // Call optional callback
      if (this.onPoll) {
        this.onPoll(escrows);
      }
    } catch (err) {
      const message = userErrorMessage(err);
      store.setError(message);

      if (this.state) {
        this.state.status = "error";
        this.state.error = message;
      }
    } finally {
      store.setLoading(false);
    }
  }
}

export function getSyncManager(options?: SyncManagerOptions): SyncManager {
  return SyncManager.getInstance(options);
}
