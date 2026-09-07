import type {
  ChainId,
  Escrow,
  EscrowAdapter,
  EscrowEvent,
  CreateEscrowParams,
} from "@/shared/types";
import {
  createRpcServer,
  getContractId,
  getAbi,
  type StellarRpc,
} from "./connection";
import { createEscrowTransaction } from "./create";
import { releaseEscrowTransaction } from "./release";
import { refundEscrowTransaction } from "./refund";
import { fetchEscrowAccount, listEscrowAccountsByUser } from "./query";
import { subscribeToEscrowEvents } from "./events";

export class StellarEscrowAdapter implements EscrowAdapter {
  readonly chainId: ChainId;
  private server: StellarRpc.Server;
  private contractId: string;
  private walletAddress: string | null = null;
  private signerKeypair: string | null = null;

  constructor(chainId: ChainId) {
    this.chainId = chainId;
    this.server = createRpcServer(chainId);
    this.contractId = getContractId(chainId);
  }

  setWalletAddress(address: string): void {
    this.walletAddress = address;
  }

  setSignerSecret(secret: string): void {
    this.signerKeypair = secret;
    // Derive public key from secret
    const { Keypair } = require("@stellar/stellar-sdk");
    const kp = Keypair.fromSecret(secret);
    this.walletAddress = kp.publicKey();
  }

  private getWalletAddress(): string {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set — call setWalletAddress first");
    }
    return this.walletAddress;
  }

  async createEscrow(
    params: CreateEscrowParams,
  ): Promise<{ escrowId: string; txHash: string }> {
    const walletAddress = this.getWalletAddress();
    return createEscrowTransaction(
      {
        server: this.server,
        contractId: this.contractId,
        walletAddress,
        signerSecret: this.signerKeypair,
      },
      params,
    );
  }

  async releaseEscrow(escrowId: string): Promise<{ txHash: string }> {
    const walletAddress = this.getWalletAddress();
    return releaseEscrowTransaction(
      {
        server: this.server,
        contractId: this.contractId,
        walletAddress,
        signerSecret: this.signerKeypair,
      },
      escrowId,
    );
  }

  async refundEscrow(escrowId: string): Promise<{ txHash: string }> {
    const walletAddress = this.getWalletAddress();
    return refundEscrowTransaction(
      {
        server: this.server,
        contractId: this.contractId,
        walletAddress,
        signerSecret: this.signerKeypair,
      },
      escrowId,
    );
  }

  async getEscrow(escrowId: string): Promise<Escrow | null> {
    return fetchEscrowAccount(
      {
        server: this.server,
        contractId: this.contractId,
        chainId: this.chainId,
      },
      escrowId,
    );
  }

  async listEscrowsByUser(address: string): Promise<Escrow[]> {
    return listEscrowAccountsByUser(
      {
        server: this.server,
        contractId: this.contractId,
        chainId: this.chainId,
      },
      address,
    );
  }

  subscribeEvents(onEvent: (e: EscrowEvent) => void): () => void {
    return subscribeToEscrowEvents(
      {
        server: this.server,
        contractId: this.contractId,
        chainId: this.chainId,
      },
      onEvent,
    );
  }
}

export function createStellarAdapter(chainId: ChainId): StellarEscrowAdapter {
  return new StellarEscrowAdapter(chainId);
}
