import { xdr, scValToNative, rpc as StellarRpc } from "@stellar/stellar-sdk";
import type { Escrow, ChainId, EscrowStatus } from "@/shared/types";

interface RawEscrowData {
  depositor: string;
  beneficiary: string;
  resolver: string;
  token: string;
  amount: bigint;
  status: number | string[] | string;
  nonce: bigint;
  created_at: bigint;
}

export interface QueryContext {
  server: StellarRpc.Server;
  contractId: string;
  chainId: ChainId;
}

// DataKey::Escrow(nonce) → ScVal vec [Symbol("Escrow"), U64(nonce)]
function makeEscrowKey(nonce: bigint): xdr.ScVal {
  return xdr.ScVal.scvVec([
    xdr.ScVal.scvSymbol("Escrow"),
    xdr.ScVal.scvU64(xdr.Uint64.fromString(nonce.toString())),
  ]);
}

// DataKey::Counter → ScVal vec [Symbol("Counter")]
function makeCounterKey(): xdr.ScVal {
  return xdr.ScVal.scvVec([
    xdr.ScVal.scvSymbol("Counter"),
  ]);
}

function mapStatus(raw: number | string[] | string): EscrowStatus {
  if (typeof raw === "number") {
    switch (raw) {
      case 0:
        return "created";
      case 1:
        return "released";
      case 2:
        return "refunded";
      default:
        return "created";
    }
  }
  const statusStr = Array.isArray(raw) ? raw[0] : raw;
  switch (statusStr) {
    case "Created":
      return "created";
    case "Released":
      return "released";
    case "Refunded":
      return "refunded";
    default:
      return "created";
  }
}

function mapEscrowData(raw: RawEscrowData, chainId: ChainId): Escrow {
  return {
    id: raw.nonce.toString(),
    chainId,
    depositor: raw.depositor,
    beneficiary: raw.beneficiary,
    resolver: raw.resolver,
    amount: raw.amount.toString(),
    amountRaw: raw.amount.toString(),
    tokenAddress: raw.token,
    status: mapStatus(raw.status),
    createdAt: Number(raw.created_at),
    updatedAt: Number(raw.created_at),
    txHashDeposit: "",
  };
}

export async function fetchEscrowAccount(
  ctx: QueryContext,
  escrowId: string,
): Promise<Escrow | null> {
  const nonce = BigInt(escrowId);
  const key = makeEscrowKey(nonce);

  try {
    const result = await ctx.server.getContractData(
      ctx.contractId,
      key,
      "persistent" as unknown as never,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (result as any).val;
    if (!val) return null;

    // val is LedgerEntryDataContractData — .contractData is a property, not a method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cd = (val as any).contractData;
    const scVal = cd?.val;
    if (!scVal) return null;

    const raw = scValToNative(scVal) as RawEscrowData;
    return mapEscrowData(raw, ctx.chainId);
  } catch {
    return null;
  }
}

export async function listEscrowAccountsByUser(
  ctx: QueryContext,
  userAddress: string,
): Promise<Escrow[]> {
  // Read counter to know how many escrows exist
  const counterKey = makeCounterKey();
  let count = 0;
  try {
    const result = await ctx.server.getContractData(
      ctx.contractId,
      counterKey,
      "persistent" as unknown as never,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (result as any).val;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cd = (val as any).contractData;
    const scVal = cd?.val;
    if (scVal) {
      count = Number(scValToNative(scVal));
    }
  } catch {
    return [];
  }

  // Iterate 0..count, filter by depositor
  const escrows: Escrow[] = [];
  for (let i = 0; i < count; i++) {
    const escrow = await fetchEscrowAccount(ctx, i.toString());
    if (escrow && escrow.depositor === userAddress) {
      escrows.push(escrow);
    }
  }

  return escrows;
}

export { mapEscrowData, mapStatus, makeEscrowKey, makeCounterKey };
export type { RawEscrowData };
