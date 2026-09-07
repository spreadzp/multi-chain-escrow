import type { ChainId } from "@/shared/types";
import { chains } from "./chains";

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

export const env = {
  isMockMode: parseBoolean(
    process.env.NEXT_PUBLIC_MOCK_MODE,
    true,
  ),

  rpcUrls: {
    "solana-local":
      process.env.NEXT_PUBLIC_RPC_SOLANA_LOCAL ?? chains["solana-local"].rpcUrl,
    "solana-devnet":
      process.env.NEXT_PUBLIC_RPC_SOLANA_DEVNET ??
      chains["solana-devnet"].rpcUrl,
    "stellar-local":
      process.env.NEXT_PUBLIC_RPC_STELLAR_LOCAL ??
      chains["stellar-local"].rpcUrl,
    "stellar-testnet":
      process.env.NEXT_PUBLIC_RPC_STELLAR_TESTNET ??
      chains["stellar-testnet"].rpcUrl,
  } satisfies Record<ChainId, string>,

  keysDir: {
    solana:
      process.env.SOLANA_LOCAL_KEYS_DIR ?? "../blockchains/solana/.local-keys",
    stellar:
      process.env.STELLAR_LOCAL_KEYS_DIR ??
      "../blockchains/stellar/.local-keys",
  } as const,
} as const;
