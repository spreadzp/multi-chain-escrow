import {
  Address,
  nativeToScVal,
  Keypair,
  TransactionBuilder,
  Contract,
  xdr,
  scValToNative,
  rpc as StellarRpc,
} from "@stellar/stellar-sdk";
import type { CreateEscrowParams } from "@/shared/types";

export interface CreateEscrowContext {
  server: StellarRpc.Server;
  contractId: string;
  walletAddress: string;
  signerSecret: string | null;
}

export async function createEscrowTransaction(
  ctx: CreateEscrowContext,
  params: CreateEscrowParams,
): Promise<{ escrowId: string; txHash: string }> {
  const { server, contractId, walletAddress, signerSecret } = ctx;
  const depositor = Address.fromString(walletAddress);
  const beneficiary = Address.fromString(params.beneficiary);
  const resolver = params.resolver
    ? Address.fromString(params.resolver)
    : Address.fromString(walletAddress);
  const token = Address.fromString(params.tokenAddress!);
  const amount = nativeToScVal(BigInt(params.amount), { type: "i128" });

  const contract = new Contract(contractId);
  const operation = contract.call(
    "create_escrow",
    depositor.toScVal(),
    beneficiary.toScVal(),
    resolver.toScVal(),
    token.toScVal(),
    amount,
  );

  const account = await server.getAccount(walletAddress);
  const networkPassphrase = await getNetworkPassphrase(server);

  const transaction = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  // Simulate to get footprint + auth
  const simulated = await server.simulateTransaction(transaction);
  if (StellarRpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  // Prepare transaction with simulation results (adds footprint + auth)
  const prepared = await server.prepareTransaction(transaction);
  if (!prepared) {
    throw new Error("Failed to prepare transaction");
  }

  // Sign after prepare (footprint + auth added)
  if (signerSecret) {
    const keypair = Keypair.fromSecret(signerSecret);
    prepared.sign(keypair);
  }

  // Send
  const sendResult = await server.sendTransaction(prepared);
  if (sendResult.status === "ERROR") {
    throw new Error(`Send failed: ${sendResult.errorResult?.toString() ?? "unknown"}`);
  }

  // Poll for confirmation
  const txInfo = await pollTransaction(server, sendResult.hash);
  if (!txInfo) {
    throw new Error(`Transaction not found: ${sendResult.hash}`);
  }

  if (txInfo.status !== "SUCCESS") {
    throw new Error(`Transaction failed: ${txInfo.status}`);
  }

  // Extract nonce (escrowId) from transaction result
  const escrowId = extractEscrowIdFromResult(txInfo);
  return {
    escrowId,
    txHash: sendResult.hash,
  };
}

async function getNetworkPassphrase(server: StellarRpc.Server): Promise<string> {
  const network = await server.getNetwork();
  return network.passphrase;
}

async function pollTransaction(
  server: StellarRpc.Server,
  txHash: string,
): Promise<StellarRpc.Api.GetTransactionResponse | null> {
  for (let i = 0; i < 30; i++) {
    const txInfo = await server.getTransaction(txHash);
    if (txInfo.status === "SUCCESS" || txInfo.status === "FAILED") {
      return txInfo;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return null;
}

function extractEscrowIdFromResult(
  txInfo: StellarRpc.Api.GetTransactionResponse,
): string {
  // SDK provides returnValue directly on successful transactions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const returnValue = (txInfo as any).returnValue as xdr.ScVal | undefined;
  if (!returnValue) {
    throw new Error("No return value in transaction response");
  }

  const nonce = scValToNative(returnValue);
  return String(nonce);
}
