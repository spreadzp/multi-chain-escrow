import type { ChainId } from "./chain";

export type EscrowStatus = "created" | "released" | "refunded";

export type EscrowEventType = "Deposited" | "Released" | "Refunded";

export interface Escrow {
    id: string;
    chainId: ChainId;
    depositor: string;
    beneficiary: string;
    resolver: string;
    amount: string;
    amountRaw: string;
    tokenAddress: string;
    status: EscrowStatus;
    createdAt: number;
    updatedAt: number;
    txHashDeposit: string;
    txHashRelease?: string;
    txHashRefund?: string;
}

export interface EscrowEvent {
    id: string;
    chainId: ChainId;
    type: EscrowEventType;
    escrowId: string;
    txHash: string;
    blockOrLedger: string;
    timestamp: number;
    payload: Record<string, string>;
}

export interface CreateEscrowParams {
    beneficiary: string;
    amount: string;
    resolver?: string;
    tokenAddress?: string;
}

export interface EscrowAdapter {
    chainId: ChainId;
    createEscrow(params: CreateEscrowParams): Promise<{ escrowId: string; txHash: string }>;
    releaseEscrow(escrowId: string): Promise<{ txHash: string }>;
    refundEscrow(escrowId: string): Promise<{ txHash: string }>;
    getEscrow(escrowId: string): Promise<Escrow | null>;
    listEscrowsByUser(address: string): Promise<Escrow[]>;
    subscribeEvents(onEvent: (e: EscrowEvent) => void): () => void;
    setWalletAddress(address: string): void;
}
