import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import IDL from "@/config/solana-idl.json";
import { getChainConfig } from "@/config/chains";
import { getContractConfig } from "@/config/contracts";
import type { ChainId } from "@/shared/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SolanaIdl = any;

export type { Program };

export interface SolanaConnection {
  connection: Connection;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: Program<any>;
  provider: AnchorProvider;
  programId: PublicKey;
}

export function createConnection(chainId: ChainId): Connection {
  const chain = getChainConfig(chainId);
  return new Connection(chain.rpcUrl, "confirmed");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createProgram(
  connection: Connection,
  wallet: Wallet,
  chainId: ChainId,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Program<any> {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const contractConfig = getContractConfig(chainId);
  const programId = new PublicKey(contractConfig.programId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(IDL as SolanaIdl, provider);
}

export function getProgramId(chainId: ChainId): PublicKey {
  const contractConfig = getContractConfig(chainId);
  return new PublicKey(contractConfig.programId);
}

export function createKeypairWallet(keypair: Keypair): Wallet {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signer = keypair as any;
  return {
    publicKey: keypair.publicKey,
    payer: keypair,
    signTransaction: async (tx) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (tx as any).sign(signer);
      return tx;
    },
    signAllTransactions: async (txs) => {
      for (const tx of txs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tx as any).sign(signer);
      }
      return txs;
    },
  };
}
