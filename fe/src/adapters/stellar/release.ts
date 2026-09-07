import { Address, nativeToScVal, type xdr } from "@stellar/stellar-sdk";
import { submitContractCall, type TxContext } from "./tx";

export async function releaseEscrowTransaction(
  ctx: TxContext,
  escrowId: string,
): Promise<{ txHash: string }> {
  const caller = Address.fromString(ctx.walletAddress);
  const nonce = nativeToScVal(BigInt(escrowId), { type: "u64" });

  const args: xdr.ScVal[] = [caller.toScVal(), nonce];

  const { txHash } = await submitContractCall(ctx, "release_escrow", args);
  return { txHash };
}
