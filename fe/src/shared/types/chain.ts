export type ChainFamily = "solana" | "stellar";
export type ChainId =
  | "solana-local"
  | "solana-devnet"
  | "stellar-local"
  | "stellar-testnet";

export interface ChainConfig {
  id: ChainId;
  family: ChainFamily;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  isLocal: boolean;
  faucetUrl?: string;
}

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";
export interface WalletSession {
  address: string;
  chainId: ChainId;
  connectedAt: number;
}
