import { PublicKey, Connection, GetProgramAccountsFilter } from "@solana/web3.js";
import type { Program } from "@coral-xyz/anchor";
import type { Escrow } from "@/shared/types";
import { getChainConfig } from "@/config/chains";

const ESCROW_ACCOUNT_DISCRIMINATOR_LEN = 8;
const DEPOSITOR_OFFSET = ESCROW_ACCOUNT_DISCRIMINATOR_LEN;
const BENEFICIARY_OFFSET = DEPOSITOR_OFFSET + 32;

export interface RawEscrowAccount {
  depositor: PublicKey;
  beneficiary: PublicKey;
  resolver: PublicKey;
  mint: PublicKey;
  amount: bigint;
  status: { created: {} } | { released: {} } | { refunded: {} };
  nonce: bigint;
  bump: number;
  createdAt: bigint;
  txHashDeposit: number[];
}

function statusToString(status: RawEscrowAccount["status"]): "created" | "released" | "refunded" {
  if ("created" in status) return "created";
  if ("released" in status) return "released";
  return "refunded";
}

function txHashFromArray(arr: number[]): string {
  return Buffer.from(arr).toString("hex");
}

export function mapEscrowAccount(
  raw: RawEscrowAccount,
  escrowPda: PublicKey,
  chainId: Escrow["chainId"],
): Escrow {
  const status = statusToString(raw.status);
  return {
    id: escrowPda.toBase58(),
    chainId,
    depositor: raw.depositor.toBase58(),
    beneficiary: raw.beneficiary.toBase58(),
    resolver: raw.resolver.toBase58(),
    amount: raw.amount.toString(),
    amountRaw: raw.amount.toString(),
    tokenAddress: raw.mint.toBase58(),
    status,
    createdAt: Number(raw.createdAt),
    updatedAt: Number(raw.createdAt),
    txHashDeposit: txHashFromArray(raw.txHashDeposit),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchEscrowAccount(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: Program<any>,
  escrowPda: PublicKey,
): Promise<Escrow | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (await (program.account as any).escrowAccount.fetch(escrowPda.toBase58())) as RawEscrowAccount;
    const chainId = getChainConfig("solana-local").id;
    return mapEscrowAccount(raw, escrowPda, chainId);
  } catch {
    return null;
  }
}

export async function listEscrowAccountsByUser(
  connection: Connection,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: Program<any>,
  userAddress: PublicKey,
  programId: PublicKey,
  chainId: Escrow["chainId"],
): Promise<Escrow[]> {
  const userFilter: GetProgramAccountsFilter = {
    memcmp: {
      offset: DEPOSITOR_OFFSET,
      bytes: userAddress.toBase58(),
    },
  };

  const accounts = await connection.getProgramAccounts(programId, {
    filters: [userFilter],
  });

  const escrows: Escrow[] = [];
  for (const { pubkey, account } of accounts) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (program.coder as any).accounts.decode(
        "escrowAccount",
        account.data,
      ) as RawEscrowAccount;
      escrows.push(mapEscrowAccount(raw, pubkey, chainId));
    } catch {
      // skip accounts that fail to decode
    }
  }

  return escrows;
}

export { DEPOSITOR_OFFSET, BENEFICIARY_OFFSET };
