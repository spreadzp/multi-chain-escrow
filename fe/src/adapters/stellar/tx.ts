import {
  Address,
  Keypair,
  TransactionBuilder,
  Contract,
  xdr,
  scValToNative,
  nativeToScVal,
  rpc as StellarRpc,
} from "@stellar/stellar-sdk";

export interface TxContext {
  server: StellarRpc.Server;
  contractId: string;
  walletAddress: string;
  signerSecret: string | null;
}

export async function getNetworkPassphrase(server: StellarRpc.Server): Promise<string> {
  const network = await server.getNetwork();
  return network.passphrase;
}

export async function pollTransaction(
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

export async function submitContractCall(
  ctx: TxContext,
  methodName: string,
  args: xdr.ScVal[],
): Promise<{ txHash: string; txInfo: StellarRpc.Api.GetTransactionResponse }> {
  const { server, contractId, walletAddress, signerSecret } = ctx;

  const contract = new Contract(contractId);
  const operation = contract.call(methodName, ...args);

  const account = await server.getAccount(walletAddress);
  const networkPassphrase = await getNetworkPassphrase(server);

  const transaction = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(transaction);
  if (StellarRpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  const prepared = await server.prepareTransaction(transaction);
  if (!prepared) {
    throw new Error("Failed to prepare transaction");
  }

  if (signerSecret) {
    const keypair = Keypair.fromSecret(signerSecret);
    prepared.sign(keypair);
  }

  const sendResult = await server.sendTransaction(prepared);
  if (sendResult.status === "ERROR") {
    throw new Error(`Send failed: ${sendResult.errorResult?.toString() ?? "unknown"}`);
  }

  const txInfo = await pollTransaction(server, sendResult.hash);
  if (!txInfo) {
    throw new Error(`Transaction not found: ${sendResult.hash}`);
  }

  if (txInfo.status !== "SUCCESS") {
    throw new Error(`Transaction failed: ${txInfo.status}`);
  }

  return { txHash: sendResult.hash, txInfo };
}

export function extractReturnValue(txInfo: StellarRpc.Api.GetTransactionResponse): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metaXdr = (txInfo as any).resultMetaXdr;
  if (!metaXdr) {
    throw new Error("No resultMetaXdr in transaction response");
  }

  const meta = xdr.TransactionMeta.fromXDR(metaXdr, "base64");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v3 = (meta as any).v3();
  if (v3 && v3.sorobanMeta()) {
    const returnValue = v3.sorobanMeta().returnValue();
    if (returnValue) {
      return scValToNative(returnValue);
    }
  }

  throw new Error("No return value in transaction meta");
}

export { Address, nativeToScVal };
