import type { ChainConfig, ChainFamily, ChainId } from "@/shared/types";

const solanaLocal: ChainConfig = {
  id: "solana-local",
  family: "solana",
  name: "Solana Localnet",
  rpcUrl: "http://localhost:8899",
  explorerUrl: "http://localhost:3000",
  isLocal: true,
};

const solanaDevnet: ChainConfig = {
  id: "solana-devnet",
  family: "solana",
  name: "Solana Devnet",
  rpcUrl: "https://api.devnet.solana.com",
  explorerUrl: "https://explorer.solana.com",
  isLocal: false,
};

const stellarLocal: ChainConfig = {
  id: "stellar-local",
  family: "stellar",
  name: "Stellar Localnet",
  rpcUrl: "http://localhost:8000/rpc",
  explorerUrl: "http://localhost:8000",
  isLocal: true,
  faucetUrl: "http://localhost:8002",
};

const stellarTestnet: ChainConfig = {
  id: "stellar-testnet",
  family: "stellar",
  name: "Stellar Testnet",
  rpcUrl: "https://soroban-testnet.stellar.org",
  explorerUrl: "https://stellar.expert",
  isLocal: false,
};

export const chains: Record<ChainId, ChainConfig> = {
  "solana-local": solanaLocal,
  "solana-devnet": solanaDevnet,
  "stellar-local": stellarLocal,
  "stellar-testnet": stellarTestnet,
};

export function getChainConfig(chainId: ChainId): ChainConfig {
  return chains[chainId];
}

export function getExplorerTxUrl(
  family: ChainFamily,
  txHash: string,
  isLocal: boolean,
): string {
  if (family === "solana") {
    const cluster = isLocal ? "?cluster=custom" : "?cluster=devnet";
    return `https://explorer.solana.com/tx/${txHash}${cluster}`;
  }
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}
