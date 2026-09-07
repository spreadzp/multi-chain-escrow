import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { CreateEscrowParams } from "@/shared/types";
import { getContractConfig } from "@/config/contracts";

const SEED_PREFIX = Buffer.from("escrow");

export function findEscrowPda(
  depositor: PublicKey,
  beneficiary: PublicKey,
  nonce: bigint,
  programId: PublicKey,
): { pda: PublicKey; bump: number } {
  const nonceBuf = Buffer.alloc(8);
  nonceBuf.writeBigUInt64LE(nonce);
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [SEED_PREFIX, depositor.toBuffer(), beneficiary.toBuffer(), nonceBuf],
    programId,
  );
  return { pda, bump };
}

export function deriveEscrowAta(mint: PublicKey, escrowPda: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(mint, escrowPda, true);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createEscrowInstruction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: Program<any>,
  depositor: PublicKey,
  params: CreateEscrowParams,
  programId: PublicKey,
): Promise<{ escrowId: string; txHash: string }> {
  const beneficiary = new PublicKey(params.beneficiary);
  const config = getContractConfig("solana-local");
  const resolver = params.resolver
    ? new PublicKey(params.resolver)
    : new PublicKey(config.resolverId);
  const mint = params.tokenAddress
    ? new PublicKey(params.tokenAddress)
    : new PublicKey(config.tokenMint);
  const amount = new BN(params.amount);
  const nonce = new BN(Date.now());
  const nonceBigint = BigInt(nonce.toString());

  const depositorAta = getAssociatedTokenAddressSync(mint, depositor);
  const { pda: escrowPda } = findEscrowPda(depositor, beneficiary, nonceBigint, programId);
  const escrowAta = deriveEscrowAta(mint, escrowPda);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const methods = program.methods as any;
  const txHash = await methods
    .createEscrow(beneficiary, resolver, amount, nonce)
    .accounts({
      depositor,
      mint,
      depositorAta,
      escrowPda,
      escrowAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  return {
    escrowId: escrowPda.toBase58(),
    txHash,
  };
}
