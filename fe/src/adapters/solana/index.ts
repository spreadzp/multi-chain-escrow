import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import type {
  ChainId,
  Escrow,
  EscrowAdapter,
  EscrowEvent,
  CreateEscrowParams,
} from "@/shared/types";
import {
  createConnection,
  createProgram,
  createKeypairWallet,
  getProgramId,
} from "./connection";
import { createEscrowInstruction } from "./create";
import { releaseEscrowInstruction } from "./release";
import { refundEscrowInstruction } from "./refund";
import { fetchEscrowAccount, listEscrowAccountsByUser } from "./query";
import { subscribeToEscrowEvents } from "./events";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SolanaProgram = Program<any>;

export class SolanaEscrowAdapter implements EscrowAdapter {
  readonly chainId: ChainId;
  private connection: Connection;
  private program: SolanaProgram | null = null;
  private provider: AnchorProvider | null = null;
  private walletAddress: string | null = null;
  private signerKeypair: Keypair | null = null;
  private programId: PublicKey;

  constructor(chainId: ChainId) {
    this.chainId = chainId;
    this.connection = createConnection(chainId);
    this.programId = getProgramId(chainId);
  }

  setWalletAddress(address: string): void {
    this.walletAddress = address;
  }

  setKeypair(keypair: Keypair): void {
    this.signerKeypair = keypair;
    this.walletAddress = keypair.publicKey.toBase58();
  }

  private getProgram(): SolanaProgram {
    if (this.program) return this.program;
    if (!this.walletAddress) {
      throw new Error("Wallet address not set — call setWalletAddress first");
    }
    const keypair = this.signerKeypair ?? Keypair.generate();
    const wallet = createKeypairWallet(keypair);
    this.program = createProgram(this.connection, wallet, this.chainId);
    this.provider = (this.program as unknown as { provider: AnchorProvider }).provider;
    return this.program;
  }

  async createEscrow(
    params: CreateEscrowParams,
  ): Promise<{ escrowId: string; txHash: string }> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set — call setWalletAddress first");
    }
    const program = this.getProgram();
    const depositor = new PublicKey(this.walletAddress);
    return createEscrowInstruction(program, depositor, params, this.programId);
  }

  async releaseEscrow(escrowId: string): Promise<{ txHash: string }> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set — call setWalletAddress first");
    }
    const program = this.getProgram();
    const signer = new PublicKey(this.walletAddress);
    const escrowPda = new PublicKey(escrowId);
    const mint = await this.getMintFromEscrow(escrowPda);
    return releaseEscrowInstruction(program, signer, escrowPda, mint);
  }

  async refundEscrow(escrowId: string): Promise<{ txHash: string }> {
    if (!this.walletAddress) {
      throw new Error("Wallet address not set — call setWalletAddress first");
    }
    const program = this.getProgram();
    const signer = new PublicKey(this.walletAddress);
    const escrowPda = new PublicKey(escrowId);
    const mint = await this.getMintFromEscrow(escrowPda);
    return refundEscrowInstruction(program, signer, escrowPda, mint);
  }

  async getEscrow(escrowId: string): Promise<Escrow | null> {
    const program = this.getProgram();
    const escrowPda = new PublicKey(escrowId);
    return fetchEscrowAccount(program, escrowPda);
  }

  async listEscrowsByUser(address: string): Promise<Escrow[]> {
    const program = this.getProgram();
    const userAddress = new PublicKey(address);
    return listEscrowAccountsByUser(
      this.connection,
      program,
      userAddress,
      this.programId,
      this.chainId,
    );
  }

  private async getMintFromEscrow(escrowPda: PublicKey): Promise<PublicKey> {
    const program = this.getProgram();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account = await (program.account as any).escrowAccount.fetch(escrowPda.toBase58());
    return new PublicKey(account.mint);
  }

  subscribeEvents(onEvent: (e: EscrowEvent) => void): () => void {
    return subscribeToEscrowEvents(
      this.connection,
      this.programId,
      this.chainId,
      onEvent,
    );
  }
}

export function createSolanaAdapter(chainId: ChainId): SolanaEscrowAdapter {
  return new SolanaEscrowAdapter(chainId);
}
