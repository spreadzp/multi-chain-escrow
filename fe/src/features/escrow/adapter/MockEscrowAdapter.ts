import type {
  ChainId,
  Escrow,
  EscrowEvent,
  CreateEscrowParams,
  EscrowAdapter,
} from "@/shared/types";
import { EscrowAdapterError } from "./types";
import { assertCanRelease, assertCanRefund } from "../domain/roles";
import { saveToStorage, loadFromStorage } from "./mock-persist";

function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function randomDelay(): number {
  return 200 + Math.floor(Math.random() * 300);
}

export class MockEscrowAdapter implements EscrowAdapter {
  readonly chainId: ChainId;
  private escrows = new Map<string, Escrow>();
  private walletAddress = "";
  private subscribers = new Set<(e: EscrowEvent) => void>();

  constructor(chainId: ChainId) {
    this.chainId = chainId;
    for (const escrow of loadFromStorage(chainId)) {
      this.escrows.set(escrow.id, escrow);
    }
  }

  setWalletAddress(address: string): void {
    this.walletAddress = address;
  }

  private ensureConnected(): void {
    if (!this.walletAddress) {
      throw new EscrowAdapterError(
        "not_connected",
        "No wallet address set. Call setWalletAddress() first.",
      );
    }
  }

  private emit(event: EscrowEvent): void {
    for (const cb of this.subscribers) {
      cb(event);
    }
  }

  private persist(): void {
    saveToStorage(this.chainId, [...this.escrows.values()]);
  }

  async createEscrow(
    params: CreateEscrowParams,
  ): Promise<{ escrowId: string; txHash: string }> {
    this.ensureConnected();

    await new Promise((r) => setTimeout(r, randomDelay()));

    const escrowId = randomId("mock-esc");
    const txHash = randomId("mock-tx");
    const now = Date.now();

    const escrow: Escrow = {
      id: escrowId,
      chainId: this.chainId,
      depositor: this.walletAddress,
      beneficiary: params.beneficiary,
      resolver: params.resolver ?? params.beneficiary,
      amount: params.amount,
      amountRaw: params.amount,
      tokenAddress: params.tokenAddress ?? "",
      status: "created",
      createdAt: now,
      updatedAt: now,
      txHashDeposit: txHash,
    };

    this.escrows.set(escrowId, escrow);
    this.persist();

    this.emit({
      id: randomId("mock-evt"),
      chainId: this.chainId,
      type: "Deposited",
      escrowId,
      txHash,
      blockOrLedger: String(Math.floor(now / 1000)),
      timestamp: now,
      payload: {},
    });

    return { escrowId, txHash };
  }

  async releaseEscrow(escrowId: string): Promise<{ txHash: string }> {
    this.ensureConnected();

    await new Promise((r) => setTimeout(r, randomDelay()));

    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new EscrowAdapterError(
        "escrow_not_found",
        `Escrow ${escrowId} not found`,
      );
    }

    assertCanRelease(escrow, this.walletAddress);

    const txHash = randomId("mock-tx");
    const now = Date.now();

    escrow.status = "released";
    escrow.txHashRelease = txHash;
    escrow.updatedAt = now;
    this.persist();

    this.emit({
      id: randomId("mock-evt"),
      chainId: this.chainId,
      type: "Released",
      escrowId,
      txHash,
      blockOrLedger: String(Math.floor(now / 1000)),
      timestamp: now,
      payload: {},
    });

    return { txHash };
  }

  async refundEscrow(escrowId: string): Promise<{ txHash: string }> {
    this.ensureConnected();

    await new Promise((r) => setTimeout(r, randomDelay()));

    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new EscrowAdapterError(
        "escrow_not_found",
        `Escrow ${escrowId} not found`,
      );
    }

    assertCanRefund(escrow, this.walletAddress);

    const txHash = randomId("mock-tx");
    const now = Date.now();

    escrow.status = "refunded";
    escrow.txHashRefund = txHash;
    escrow.updatedAt = now;
    this.persist();

    this.emit({
      id: randomId("mock-evt"),
      chainId: this.chainId,
      type: "Refunded",
      escrowId,
      txHash,
      blockOrLedger: String(Math.floor(now / 1000)),
      timestamp: now,
      payload: {},
    });

    return { txHash };
  }

  async getEscrow(escrowId: string): Promise<Escrow | null> {
    this.ensureConnected();

    await new Promise((r) => setTimeout(r, randomDelay()));

    return this.escrows.get(escrowId) ?? null;
  }

  async listEscrowsByUser(address: string): Promise<Escrow[]> {
    this.ensureConnected();

    await new Promise((r) => setTimeout(r, randomDelay()));

    const result: Escrow[] = [];
    for (const escrow of this.escrows.values()) {
      if (
        escrow.depositor === address ||
        escrow.beneficiary === address ||
        escrow.resolver === address
      ) {
        result.push(escrow);
      }
    }
    return result;
  }

  subscribeEvents(onEvent: (e: EscrowEvent) => void): () => void {
    this.subscribers.add(onEvent);
    return () => {
      this.subscribers.delete(onEvent);
    };
  }
}
