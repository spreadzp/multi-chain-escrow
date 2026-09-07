// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { SolanaEscrowAdapter } from "../index";
import { findEscrowPda } from "../create";
import { parseEventsFromLogMessages } from "../events";

const RPC_URL = "http://localhost:8899";
const PROGRAM_ID = new PublicKey("BhuNTxtQt8StnXgsqNwJmj8EJTC171g213RzG2U8Z8Cj");

// Load keypairs from .local-keys
function loadKeypair(role: string): Keypair {
  const fs = require("fs");
  const path = require("path");
  const filePath = path.join(
    process.cwd(),
    "..",
    "blockchains",
    "solana",
    ".local-keys",
    `${role}.json`,
  );
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Keypair.fromSecretKey(new Uint8Array(data.secretKey));
}

const depositor = loadKeypair("depositor");
const beneficiary = loadKeypair("beneficiary");
const resolver = loadKeypair("resolver");

const MINT_AMOUNT = 10_000_000_000;
const ESCROW_AMOUNT = 500_000_000;

describe("SolanaEscrowAdapter — integration (SLICE-08-6)", () => {
  let connection: Connection;
  let mint: PublicKey;
  let depositorAta: PublicKey;
  let beneficiaryAta: PublicKey;
  let adapter: SolanaEscrowAdapter;
  let escrowId: string;
  let createTxHash: string;

  beforeAll(async () => {
    connection = new Connection(RPC_URL, "confirmed");

    // Create mint with depositor as authority
    mint = await createMint(
      connection,
      depositor,
      depositor.publicKey,
      null,
      9,
    );

    // Create token accounts
    const depAta = await getOrCreateAssociatedTokenAccount(
      connection,
      depositor,
      mint,
      depositor.publicKey,
    );
    depositorAta = depAta.address;

    const benAta = await getOrCreateAssociatedTokenAccount(
      connection,
      beneficiary,
      mint,
      beneficiary.publicKey,
    );
    beneficiaryAta = benAta.address;

    // Mint tokens to depositor
    await mintTo(
      connection,
      depositor,
      mint,
      depositorAta,
      depositor,
      MINT_AMOUNT,
    );

    // Set up adapter with depositor wallet
    adapter = new SolanaEscrowAdapter("solana-local");
    adapter.setKeypair(depositor);
  }, 60000);

  it("creates escrow with real PDA and token transfer", async () => {
    const result = await adapter.createEscrow({
      beneficiary: beneficiary.publicKey.toBase58(),
      resolver: resolver.publicKey.toBase58(),
      amount: ESCROW_AMOUNT.toString(),
      tokenAddress: mint.toBase58(),
    });

    escrowId = result.escrowId;
    createTxHash = result.txHash;

    expect(escrowId).toBeTruthy();
    expect(createTxHash).toBeTruthy();

    // Verify PDA is valid PublicKey
    const pda = new PublicKey(escrowId);
    expect(pda).toBeInstanceOf(PublicKey);
  }, 30000);

  it("getEscrow reads on-chain account", async () => {
    const escrow = await adapter.getEscrow(escrowId);
    expect(escrow).not.toBeNull();
    expect(escrow!.depositor).toBe(depositor.publicKey.toBase58());
    expect(escrow!.beneficiary).toBe(beneficiary.publicKey.toBase58());
    expect(escrow!.resolver).toBe(resolver.publicKey.toBase58());
    expect(escrow!.tokenAddress).toBe(mint.toBase58());
    expect(escrow!.amount).toBe(ESCROW_AMOUNT.toString());
    expect(escrow!.status).toBe("created");
  }, 15000);

  it("listEscrowsByUser returns escrows for depositor", async () => {
    const escrows = await adapter.listEscrowsByUser(depositor.publicKey.toBase58());
    expect(escrows.length).toBeGreaterThanOrEqual(1);
    const found = escrows.find((e) => e.id === escrowId);
    expect(found).toBeDefined();
    expect(found!.status).toBe("created");
  }, 15000);

  it("releases escrow and tokens go to beneficiary", async () => {
    // Get beneficiary balance before
    const benBalanceBefore = await connection.getTokenAccountBalance(beneficiaryAta);
    const beforeAmount = BigInt(benBalanceBefore.value.amount);

    // Use beneficiary as signer for release
    const releaseAdapter = new SolanaEscrowAdapter("solana-local");
    releaseAdapter.setKeypair(beneficiary);

    const result = await releaseAdapter.releaseEscrow(escrowId);
    expect(result.txHash).toBeTruthy();

    // Verify beneficiary got tokens
    const benBalanceAfter = await connection.getTokenAccountBalance(beneficiaryAta);
    const afterAmount = BigInt(benBalanceAfter.value.amount);
    expect(afterAmount - beforeAmount).toBe(BigInt(ESCROW_AMOUNT));

    // Verify escrow status
    const escrow = await adapter.getEscrow(escrowId);
    expect(escrow!.status).toBe("released");
  }, 30000);

  it("getEscrow returns released status after release", async () => {
    const escrow = await adapter.getEscrow(escrowId);
    expect(escrow).not.toBeNull();
    expect(escrow!.status).toBe("released");
  }, 15000);

  it("creates second escrow and refunds it", async () => {
    // Create new escrow
    const createResult = await adapter.createEscrow({
      beneficiary: beneficiary.publicKey.toBase58(),
      resolver: resolver.publicKey.toBase58(),
      amount: ESCROW_AMOUNT.toString(),
      tokenAddress: mint.toBase58(),
    });

    expect(createResult.escrowId).toBeTruthy();

    // Get depositor balance before
    const depBalanceBefore = await connection.getTokenAccountBalance(depositorAta);
    const beforeAmount = BigInt(depBalanceBefore.value.amount);

    // Refund as depositor
    const result = await adapter.refundEscrow(createResult.escrowId);
    expect(result.txHash).toBeTruthy();

    // Verify depositor got tokens back
    const depBalanceAfter = await connection.getTokenAccountBalance(depositorAta);
    const afterAmount = BigInt(depBalanceAfter.value.amount);
    expect(afterAmount - beforeAmount).toBe(BigInt(ESCROW_AMOUNT));

    // Verify escrow status
    const escrow = await adapter.getEscrow(createResult.escrowId);
    expect(escrow!.status).toBe("refunded");
  }, 30000);

  it("parseEventsFromLogMessages extracts events from create tx logs", async () => {
    // Fetch transaction logs
    const txInfo = await connection.getTransaction(createTxHash, {
      maxSupportedTransactionVersion: 0,
    });
    expect(txInfo).not.toBeNull();
    const logs = txInfo?.meta?.logMessages ?? [];
    expect(logs.length).toBeGreaterThan(0);

    const events = parseEventsFromLogMessages(logs);
    const deposited = events.find((e) => e.type === "Deposited");
    expect(deposited).toBeDefined();
    expect(deposited!.escrowPda).toBe(escrowId);
  }, 15000);

  it("subscribeEvents returns cleanup function", () => {
    const unsub = adapter.subscribeEvents(() => { });
    expect(typeof unsub).toBe("function");
    unsub();
  });
});
