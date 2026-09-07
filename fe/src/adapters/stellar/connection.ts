import { rpc as StellarRpc, Keypair, Address, nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";
import type { ChainId } from "@/shared/types";
import { getChainConfig } from "@/config/chains";
import { getContractConfig } from "@/config/contracts";
import ABI from "@/config/stellar-abi.json";

export type { StellarRpc };

export interface StellarContractAbi {
  name: string;
  version: string;
  network: string;
  contractId: string;
  wasmHash: string;
  functions: Array<{
    name: string;
    inputs: Array<{ name: string; type: string }>;
    returns: string;
  }>;
}

export function createRpcServer(chainId: ChainId): StellarRpc.Server {
  const chain = getChainConfig(chainId);
  return new StellarRpc.Server(chain.rpcUrl, { allowHttp: chain.isLocal });
}

export function getContractId(chainId: ChainId): string {
  const config = getContractConfig(chainId);
  return config.contractId;
}

export function getAbi(): StellarContractAbi {
  return ABI as StellarContractAbi;
}

export function createKeypairFromSecret(secret: string): Keypair {
  return Keypair.fromSecret(secret);
}

export function addressToString(address: string): string {
  // Stellar addresses can be G-accounts or C-contracts
  return address;
}

export function stringToAddress(address: string): Address {
  return Address.fromString(address);
}

export { nativeToScVal, scValToNative, xdr, Address, Keypair };
