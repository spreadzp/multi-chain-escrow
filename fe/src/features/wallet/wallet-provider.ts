import type { ChainFamily, WalletSession } from "@/shared/types";

export type WalletErrorCode =
  | "not_installed"
  | "rejected"
  | "network_mismatch"
  | "unknown";

export class WalletError extends Error {
  readonly code: WalletErrorCode;

  constructor(code: WalletErrorCode, message: string) {
    super(message);
    this.name = "WalletError";
    this.code = code;
  }
}

export interface WalletProvider {
  readonly chainFamily: ChainFamily;
  isAvailable(): boolean;
  connect(): Promise<WalletSession>;
  disconnect(): Promise<void>;
  getAddress(): string | null;
}

export type WalletProviderRegistry = Partial<Record<ChainFamily, WalletProvider>>;
