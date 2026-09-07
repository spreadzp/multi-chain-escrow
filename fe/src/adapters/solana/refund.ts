import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import type { Program } from "@coral-xyz/anchor";

export async function refundEscrowInstruction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: Program<any>,
  signer: PublicKey,
  escrowPda: PublicKey,
  mint: PublicKey,
): Promise<{ txHash: string }> {
  const escrowAta = getAssociatedTokenAddressSync(mint, escrowPda, true);
  const depositorAta = getAssociatedTokenAddressSync(mint, signer);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const methods = program.methods as any;
  const txHash = await methods
    .refundEscrow()
    .accounts({
      signer,
      escrowPda,
      mint,
      escrowAta,
      depositorAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return { txHash };
}
